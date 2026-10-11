import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module.js';
import { ActivityQueueModule } from './activity/activity-queue.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StudentsModule } from './students/students.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { UsersModule } from './users/users.module.js';
import { ActivityModule } from './activity/activity.module.js';

@Module({
  imports: [
    PrismaModule,
    ActivityQueueModule,
    AuthModule,
    StudentsModule,
    AttendanceModule,
    UsersModule,
    ActivityModule,
  ],
})
export class AppModule {}
