import type { Actor } from './auth/auth.schema.js';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth/auth.service.js';
import { StudentsService } from './students/students.service.js';
import { AttendanceService } from './attendance/attendance.service.js';
import { csrfForSession, csrfProtection } from './csrf.js';

const teacher: Actor = {
  id: '0199b740-38aa-7000-8000-000000000001',
  name: 'Teacher',
  email: 'teacher@test.local',
  role: 'TEACHER',
  assignments: [{ grade: '8', section: 'A' }],
};
const admin: Actor = { ...teacher, role: 'ADMIN' };
const student = {
  id: '0199b740-38aa-7000-8000-000000000002',
  grade: '8',
  section: 'A',
  active: true,
};

describe('server-side assignment rules', () => {
  const auth = new AuthService({} as never, {} as never);
  it('allows the assigned class and denies a different section', () => {
    expect(() => auth.classroom(teacher, '8', 'A')).not.toThrow();
    expect(() => auth.classroom(teacher, '8', 'B')).toThrow(
      'outside your assignment',
    );
    expect(() => auth.classroom(admin, '8', 'B')).not.toThrow();
  });
  it('denies teacher attendance through the service even with a direct student ID', async () => {
    const db = {
      student: {
        findUnique: vi.fn().mockResolvedValue({ ...student, section: 'B' }),
      },
      $transaction: vi.fn(),
    };
    const service = new AttendanceService(db as never, auth);
    await expect(
      service.record(
        { studentId: student.id, date: new Date(), status: 'PRESENT' },
        teacher,
      ),
    ).rejects.toThrow('outside your assignment');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('denies reading attendance from another section', async () => {
    const db = { student: { findMany: vi.fn() } };
    const service = new AttendanceService(db as never, auth);
    await expect(
      service.byClass({ grade: '9', section: 'B', date: new Date() }, teacher),
    ).rejects.toThrow('outside your assignment');
    expect(db.student.findMany).not.toHaveBeenCalled();
  });
  it('keeps fee fields out of a teacher class register', async () => {
    const db = {
      attendance: { groupBy: vi.fn().mockResolvedValue([]) },
      student: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            ...student,
            name: 'Demo',
            feeStatus: 'PENDING',
            amountDue: 100,
            attendance: [],
          },
        ]),
      },
    };
    const service = new AttendanceService(db as never, auth);
    const result = await service.byClass(
      { grade: '8', section: 'A', date: new Date() },
      teacher,
    );
    expect(result.items[0]).not.toHaveProperty('amountDue');
    expect(result.totals.UNMARKED).toBe(1);
  });
});

describe('attendance uniqueness and corrections', () => {
  it('returns conflict when the database unique constraint rejects a duplicate', async () => {
    const db = {
      student: { findUnique: vi.fn().mockResolvedValue(student) },
      $transaction: vi.fn().mockRejectedValue({ code: 'P2002' }),
    };
    const service = new AttendanceService(
      db as never,
      new AuthService({} as never, {} as never),
    );
    await expect(
      service.record(
        { studentId: student.id, date: new Date(), status: 'PRESENT' },
        teacher,
      ),
    ).rejects.toThrow('already recorded');
  });
  it('corrects a mark and writes an audit row in one transaction', async () => {
    const row = {
      id: '0199b740-38aa-7000-8000-000000000003',
      student,
      studentId: student.id,
      date: new Date('2026-10-10T00:00:00.000Z'),
      status: 'ABSENT',
    };
    const tx = {
      attendance: {
        update: vi.fn().mockResolvedValue({ ...row, status: 'PRESENT' }),
      },
      attendanceAudit: { create: vi.fn() },
      activityLog: { create: vi.fn() },
    };
    const db = {
      attendance: { findUnique: vi.fn().mockResolvedValue(row) },
      $transaction: vi.fn((action: (tx: typeof tx) => unknown) => action(tx)),
    };
    const service = new AttendanceService(
      db as never,
      new AuthService({} as never, {} as never),
    );
    await service.correct(row.id, 'PRESENT', teacher);
    expect(tx.attendance.update).toHaveBeenCalledWith({
      where: { id: row.id },
      data: { status: 'PRESENT', recordedById: teacher.id },
    });
    expect(tx.attendanceAudit.create).toHaveBeenCalledWith({
      data: {
        attendanceId: row.id,
        changedById: teacher.id,
        oldStatus: 'ABSENT',
        newStatus: 'PRESENT',
      },
    });
    expect(tx.activityLog.create).toHaveBeenCalledOnce();
  });
});

describe('student permissions and uniqueness', () => {
  it('allocates a server-side admission number', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ value: 1001n }]),
      student: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
      activityLog: { create: vi.fn() },
      $transaction: vi.fn((action: (tx: unknown) => unknown) => action(db)),
    };
    const service = new StudentsService(
      db as never,
      new AuthService({} as never, {} as never),
    );
    const saved = await service.create(
      {
        name: 'Test Child',
        grade: '8',
        section: 'A',
        guardianName: 'Test Guardian',
        active: true,
        feeStatus: 'PAID',
        amountDue: 0,
      },
      admin,
    );
    expect(saved.admissionNumber).toMatch(/^SCH-\d{4}-001001$/);
  });
  it('limits teacher search to assignments and removes fee fields', async () => {
    const db = {
      student: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { ...student, feeStatus: 'PENDING', amountDue: 2500 },
          ]),
        count: vi.fn().mockResolvedValue(1),
      },
      $transaction: vi.fn(async (queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
    };
    const service = new StudentsService(
      db as never,
      new AuthService({} as never, {} as never),
    );
    const result = await service.list(
      { page: 1, limit: 20, q: 'test', grade: '8', section: 'A' },
      teacher,
    );
    expect(result.items[0]).not.toHaveProperty('amountDue');
    expect(db.student.findMany.mock.calls[0][0].where.AND[0].OR).toEqual([
      { grade: '8', section: 'A' },
    ]);
  });
  it('denies teacher creation before a write', async () => {
    const db = { student: { create: vi.fn() } };
    const service = new StudentsService(
      db as never,
      new AuthService({} as never, {} as never),
    );
    await expect(
      service.create(
        {
          name: 'Test Child',
          grade: '8',
          section: 'A',
          guardianName: 'Test Guardian',
          active: true,
          feeStatus: 'PAID',
          amountDue: 0,
        },
        teacher,
      ),
    ).rejects.toThrow('Admin access required');
    expect(db.student.create).not.toHaveBeenCalled();
  });
  it('returns conflict for duplicate admission numbers', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ value: 1000n }]),
      student: { create: vi.fn().mockRejectedValue({ code: 'P2002' }) },
      activityLog: { create: vi.fn() },
      $transaction: vi.fn((action: (tx: unknown) => unknown) => action(db)),
    };
    const service = new StudentsService(
      db as never,
      new AuthService({} as never, {} as never),
    );
    await expect(
      service.create(
        {
          name: 'Test Child',
          grade: '8',
          section: 'A',
          guardianName: 'Test Guardian',
          active: true,
          feeStatus: 'PAID',
          amountDue: 0,
        },
        admin,
      ),
    ).rejects.toThrow('already exists');
  });
});

describe('CSRF protection', () => {
  it('rejects a write without the token and accepts a valid token', () => {
    process.env.SESSION_SECRET = 'test-secret-with-at-least-32-characters';
    const session = 'demo-session';
    const req = {
      method: 'POST',
      path: '/api/students',
      sessionID: session,
      session: { userId: teacher.id },
      headers: {},
    } as never;
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as never;
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    csrfProtection(
      {
        ...req,
        headers: {
          'x-csrf-token': csrfForSession(session),
        },
      },
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
