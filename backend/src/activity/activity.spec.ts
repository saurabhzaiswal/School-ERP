import { describe, expect, it, vi } from 'vitest';
import { ActivityService } from './activity.service.js';

describe('activity access', () => {
  it('forces teachers to their own actor ID even when another actor is requested', async () => {
    const ownId = '0199b740-38aa-7000-8000-000000000001';
    const db = {
      activityLog: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      $transaction: vi.fn(async (items: Promise<unknown>[]) =>
        Promise.all(items),
      ),
    };
    const auth = {
      actor: vi.fn().mockResolvedValue({ id: ownId, role: 'TEACHER' }),
    };
    const service = new ActivityService(db as never, auth as never);
    await service.list(
      { page: 1, actorId: '0199b740-38aa-7000-8000-000000000099' },
      {} as never,
    );
    expect(db.activityLog.findMany.mock.calls[0][0].where.actorId).toBe(ownId);
    expect(
      db.activityLog.findMany.mock.calls[0][0].where.action.notIn,
    ).toContain('SESSION_LOGIN');
  });
  it('filters administrator activity by actor role and inclusive date range', async () => {
    const db = {
      activityLog: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      $transaction: vi.fn(async (items: Promise<unknown>[]) =>
        Promise.all(items),
      ),
    };
    const auth = {
      actor: vi
        .fn()
        .mockResolvedValue({
          id: '0199b740-38aa-7000-8000-000000000001',
          role: 'ADMIN',
        }),
    };
    const service = new ActivityService(db as never, auth as never);
    await service.list(
      {
        page: 1,
        role: 'TEACHER',
        dateFrom: '2026-10-10',
        dateTo: '2026-10-11',
      },
      {} as never,
    );
    const where = db.activityLog.findMany.mock.calls[0][0].where;
    expect(where.actor.role).toBe('TEACHER');
    expect(where.createdAt.gte.toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(where.createdAt.lt.toISOString()).toBe('2026-10-12T00:00:00.000Z');
  });
});
