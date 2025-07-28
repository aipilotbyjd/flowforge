import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Workflow } from '@flowforge/core-entities';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { ScheduleProcessor } from './schedule.processor';

// Define Schedule entity interface (normally would be imported)
interface Schedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextExecution: Date;
  lastExecution: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow]),
    BullModule.registerQueue({
      name: 'workflow-scheduler',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleProcessor],
  exports: [SchedulesService],
})
export class SchedulesModule {}
