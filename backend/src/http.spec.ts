import { describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module.js';
import { AuthService } from './auth/auth.service.js';
import { PrismaService } from './prisma.service.js';

describe('direct HTTP requests cannot bypass teacher assignments', () => {
  it('returns 403 for cross-class register, student, and attendance write routes', async () => {
    const teacher = {
      id: '0199b740-38aa-7000-8000-000000000001',
      name: 'Teacher',
      email: 'teacher@test.local',
      role: 'TEACHER' as const,
      assignments: [{ grade: '8', section: 'A' }],
    };
    const student = {
      id: '0199b740-38aa-7000-8000-000000000002',
      grade: '9',
      section: 'B',
      active: true,
    };
    const db = {
      student: {
        findUnique: vi.fn().mockResolvedValue(student),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    const auth = new AuthService({} as never, {} as never);
    vi.spyOn(auth, 'actor').mockResolvedValue(teacher);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .overrideProvider(AuthService)
      .useValue(auth)
      .compile();
    const app: INestApplication = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    try {
      await request(app.getHttpServer())
        .get('/api/attendance?grade=9&section=B&date=2026-10-10')
        .expect(403);
      await request(app.getHttpServer())
        .get(`/api/students/${student.id}`)
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/attendance')
        .send({ studentId: student.id, date: '2026-10-10', status: 'PRESENT' })
        .expect(403);
      expect(db.$transaction).not.toHaveBeenCalled();
      expect(db.student.findMany).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
