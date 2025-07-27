import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import * as cronParser from 'cron-parser';
import { Workflow } from '@flowforge/core/entities';

// Define Schedule interface (would normally be imported from entities)
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

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);
  private readonly scheduleStore = new Map<string, Schedule>(); // In-memory store for now
  private readonly cronJobs = new Map<string, any>(); // Active cron jobs

  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectQueue('workflow-scheduler')
    private readonly schedulerQueue: Queue,
  ) {}

  async createSchedule(createScheduleDto: {
    workflowId: string;
    cronExpression: string;
    timezone?: string;
    isActive?: boolean;
  }): Promise<Schedule> {
    this.logger.log(`Creating schedule for workflow ${createScheduleDto.workflowId}`);

    // Validate workflow exists
    const workflow = await this.workflowRepository.findOne({
      where: { id: createScheduleDto.workflowId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${createScheduleDto.workflowId} not found`);
    }

    // Validate cron expression
    if (!this.isValidCronExpression(createScheduleDto.cronExpression)) {
      throw new BadRequestException('Invalid cron expression');
    }

    // Check if schedule already exists for this workflow
    const existingSchedule = Array.from(this.scheduleStore.values()).find(
      s => s.workflowId === createScheduleDto.workflowId && s.isActive
    );

    if (existingSchedule) {
      throw new BadRequestException(`Active schedule already exists for workflow ${createScheduleDto.workflowId}`);
    }

    const scheduleId = this.generateScheduleId();
    const timezone = createScheduleDto.timezone || 'UTC';
    const nextExecution = this.calculateNextExecution(createScheduleDto.cronExpression, timezone);

    const schedule: Schedule = {
      id: scheduleId,
      workflowId: createScheduleDto.workflowId,
      cronExpression: createScheduleDto.cronExpression,
      timezone,
      isActive: createScheduleDto.isActive !== false,
      nextExecution,
      lastExecution: null,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduleStore.set(scheduleId, schedule);

    // Schedule the job if active
    if (schedule.isActive) {
      await this.scheduleJob(schedule);
    }

    this.logger.log(`Schedule created successfully: ${scheduleId}`);
    return schedule;
  }

  async getSchedules(workflowId?: string): Promise<Schedule[]> {
    let schedules = Array.from(this.scheduleStore.values());

    if (workflowId) {
      schedules = schedules.filter(schedule => schedule.workflowId === workflowId);
    }

    return schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSchedule(id: string): Promise<Schedule> {
    const schedule = this.scheduleStore.get(id);
    
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async updateSchedule(id: string, updateScheduleDto: {
    cronExpression?: string;
    timezone?: string;
    isActive?: boolean;
  }): Promise<Schedule> {
    const schedule = await this.getSchedule(id);

    // Validate cron expression if provided
    if (updateScheduleDto.cronExpression && !this.isValidCronExpression(updateScheduleDto.cronExpression)) {
      throw new BadRequestException('Invalid cron expression');
    }

    // Update schedule properties
    const updatedSchedule: Schedule = {
      ...schedule,
      ...updateScheduleDto,
      updatedAt: new Date(),
    };

    // Recalculate next execution if cron or timezone changed
    if (updateScheduleDto.cronExpression || updateScheduleDto.timezone) {
      updatedSchedule.nextExecution = this.calculateNextExecution(
        updatedSchedule.cronExpression,
        updatedSchedule.timezone
      );
    }

    this.scheduleStore.set(id, updatedSchedule);

    // Re-schedule job
    await this.unscheduleJob(id);
    if (updatedSchedule.isActive) {
      await this.scheduleJob(updatedSchedule);
    }

    this.logger.log(`Schedule updated: ${id}`);
    return updatedSchedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.getSchedule(id);
    
    // Remove scheduled job
    await this.unscheduleJob(id);
    
    // Remove from store
    this.scheduleStore.delete(id);
    
    this.logger.log(`Schedule deleted: ${id}`);
  }

  async activateSchedule(id: string): Promise<Schedule> {
    const schedule = await this.getSchedule(id);
    
    if (schedule.isActive) {
      return schedule;
    }

    const updatedSchedule = await this.updateSchedule(id, { isActive: true });
    this.logger.log(`Schedule activated: ${id}`);
    
    return updatedSchedule;
  }

  async deactivateSchedule(id: string): Promise<Schedule> {
    const schedule = await this.getSchedule(id);
    
    if (!schedule.isActive) {
      return schedule;
    }

    const updatedSchedule = await this.updateSchedule(id, { isActive: false });
    this.logger.log(`Schedule deactivated: ${id}`);
    
    return updatedSchedule;
  }

  async executeScheduledWorkflow(scheduleId: string): Promise<void> {
    const schedule = await this.getSchedule(scheduleId);
    
    if (!schedule.isActive) {
      this.logger.warn(`Attempted to execute inactive schedule: ${scheduleId}`);
      return;
    }

    try {
      this.logger.log(`Executing scheduled workflow: ${schedule.workflowId}`);

      // Add workflow execution to queue
      await this.schedulerQueue.add('execute-scheduled-workflow', {
        scheduleId,
        workflowId: schedule.workflowId,
        executionTime: new Date().toISOString(),
      }, {
        priority: 1,
        delay: 0,
      });

      // Update schedule execution info
      const updatedSchedule: Schedule = {
        ...schedule,
        lastExecution: new Date(),
        executionCount: schedule.executionCount + 1,
        nextExecution: this.calculateNextExecution(schedule.cronExpression, schedule.timezone),
        updatedAt: new Date(),
      };

      this.scheduleStore.set(scheduleId, updatedSchedule);

      // Re-schedule next execution
      await this.scheduleJob(updatedSchedule);

    } catch (error) {
      this.logger.error(`Failed to execute scheduled workflow ${schedule.workflowId}:`, error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkSchedules(): Promise<void> {
    const now = new Date();
    const activeSchedules = Array.from(this.scheduleStore.values()).filter(
      schedule => schedule.isActive && schedule.nextExecution <= now
    );

    this.logger.debug(`Checking ${activeSchedules.length} due schedules`);

    for (const schedule of activeSchedules) {
      try {
        await this.executeScheduledWorkflow(schedule.id);
      } catch (error) {
        this.logger.error(`Failed to execute schedule ${schedule.id}:`, error);
      }
    }
  }

  private async scheduleJob(schedule: Schedule): Promise<void> {
    const delay = schedule.nextExecution.getTime() - Date.now();
    
    if (delay <= 0) {
      // Execute immediately if due
      await this.executeScheduledWorkflow(schedule.id);
    } else {
      // Schedule for future execution
      const job = await this.schedulerQueue.add(
        'execute-scheduled-workflow',
        {
          scheduleId: schedule.id,
          workflowId: schedule.workflowId,
          executionTime: schedule.nextExecution.toISOString(),
        },
        {
          delay,
          jobId: `schedule-${schedule.id}`,
        }
      );

      this.cronJobs.set(schedule.id, job);
      this.logger.debug(`Scheduled job for ${schedule.id} at ${schedule.nextExecution.toISOString()}`);
    }
  }

  private async unscheduleJob(scheduleId: string): Promise<void> {
    const job = this.cronJobs.get(scheduleId);
    if (job) {
      try {
        await job.remove();
        this.cronJobs.delete(scheduleId);
        this.logger.debug(`Unscheduled job for ${scheduleId}`);
      } catch (error) {
        this.logger.warn(`Failed to remove job for schedule ${scheduleId}:`, error);
      }
    }
  }

  private isValidCronExpression(expression: string): boolean {
    try {
      cronParser.parseExpression(expression);
      return true;
    } catch (error) {
      return false;
    }
  }

  private calculateNextExecution(cronExpression: string, timezone: string): Date {
    try {
      const interval = cronParser.parseExpression(cronExpression, {
        tz: timezone,
        currentDate: new Date(),
      });
      return interval.next().toDate();
    } catch (error) {
      this.logger.error(`Error calculating next execution for cron "${cronExpression}":`, error);
      throw new BadRequestException('Invalid cron expression or timezone');
    }
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getScheduleStats(scheduleId?: string): Promise<any> {
    if (scheduleId) {
      const schedule = await this.getSchedule(scheduleId);
      return {
        scheduleId,
        workflowId: schedule.workflowId,
        cronExpression: schedule.cronExpression,
        timezone: schedule.timezone,
        isActive: schedule.isActive,
        executionCount: schedule.executionCount,
        lastExecution: schedule.lastExecution,
        nextExecution: schedule.nextExecution,
        createdAt: schedule.createdAt,
      };
    }

    const allSchedules = Array.from(this.scheduleStore.values());
    const totalSchedules = allSchedules.length;
    const activeSchedules = allSchedules.filter(s => s.isActive).length;
    const totalExecutions = allSchedules.reduce((sum, s) => sum + s.executionCount, 0);

    return {
      totalSchedules,
      activeSchedules,
      inactiveSchedules: totalSchedules - activeSchedules,
      totalExecutions,
      averageExecutionsPerSchedule: totalSchedules > 0 ? totalExecutions / totalSchedules : 0,
    };
  }

  // Method to handle workflow status changes
  async handleWorkflowStatusChange(workflowId: string, isActive: boolean): Promise<void> {
    const workflowSchedules = Array.from(this.scheduleStore.values()).filter(
      schedule => schedule.workflowId === workflowId
    );

    for (const schedule of workflowSchedules) {
      if (!isActive && schedule.isActive) {
        await this.deactivateSchedule(schedule.id);
        this.logger.log(`Deactivated schedule ${schedule.id} due to workflow ${workflowId} deactivation`);
      }
    }
  }
}
