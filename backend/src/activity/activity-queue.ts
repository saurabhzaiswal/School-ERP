import { Injectable } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import type { Queue, Job } from 'bullmq';
import { PrismaService } from '../prisma.service.js';

export type ActivityJob = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
};

@Injectable()
export class ActivityQueue {
  constructor(@InjectQueue('school-activity') private readonly queue: Queue) {}

  async add(data: ActivityJob) {
    await this.queue.add('record', data, {
      jobId: data.id,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: false,
    });
  }
}

@Processor('school-activity')
export class ActivityWorker extends WorkerHost {
  constructor(private readonly db: PrismaService) {
    super();
  }

  async process(job: Job<ActivityJob>) {
    if (job.name !== 'record')
      throw new Error(`Unknown activity job: ${job.name}`);
    await this.db.activityLog.upsert({
      where: { id: job.data.id },
      create: job.data,
      update: {},
    });
  }
}
