import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ActivityQueue, ActivityWorker } from './activity-queue.js';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379' },
    }),
    BullModule.registerQueue({ name: 'school-activity' }),
  ],
  providers: [ActivityQueue, ActivityWorker],
  exports: [ActivityQueue],
})
export class ActivityQueueModule {}
