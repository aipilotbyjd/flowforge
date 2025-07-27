import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { WorkflowExecution } from './workflow-execution.entity';

@Entity('schedules')
@Index(['workflowId', 'isActive'])
@Index(['nextExecution', 'isActive'])
@Index(['organizationId'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne(() => Workflow, workflow => workflow.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ length: 255, comment: 'Cron expression for scheduling' })
  cronExpression: string;

  @Column({ length: 100, default: 'UTC', comment: 'Timezone for the schedule' })
  timezone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'next_execution', type: 'timestamp', nullable: true })
  nextExecution: Date;

  @Column({ name: 'last_execution', type: 'timestamp', nullable: true })
  lastExecution: Date;

  @Column({ name: 'execution_count', type: 'integer', default: 0 })
  executionCount: number;

  @Column({ name: 'max_executions', type: 'integer', nullable: true, comment: 'Maximum number of executions, null for unlimited' })
  maxExecutions: number;

  @Column({ name: 'failure_count', type: 'integer', default: 0 })
  failureCount: number;

  @Column({ name: 'max_failures', type: 'integer', default: 5, comment: 'Maximum consecutive failures before deactivating' })
  maxFailures: number;

  @Column({ name: 'last_failure_at', type: 'timestamp', nullable: true })
  lastFailureAt: Date;

  @Column({ name: 'last_success_at', type: 'timestamp', nullable: true })
  lastSuccessAt: Date;

  @Column({ type: 'jsonb', nullable: true, comment: 'Input data to pass to scheduled executions' })
  inputData: any;

  @Column({ type: 'jsonb', nullable: true, comment: 'Schedule metadata and settings' })
  metadata: {
    description?: string;
    tags?: string[];
    notifications?: {
      onSuccess?: boolean;
      onFailure?: boolean;
      emails?: string[];
      webhooks?: string[];
    };
    retryPolicy?: {
      enabled: boolean;
      maxRetries: number;
      retryDelay: number; // in seconds
    };
    [key: string]: any;
  };

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true, comment: 'When this schedule expires' })
  expiresAt: Date;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true, comment: 'When this schedule should start' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true, comment: 'When this schedule should end' })
  endDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }

  get isInDateRange(): boolean {
    const now = new Date();
    const afterStart = !this.startDate || now >= this.startDate;
    const beforeEnd = !this.endDate || now <= this.endDate;
    return afterStart && beforeEnd;
  }

  get shouldRun(): boolean {
    return this.isActive && 
           !this.isExpired && 
           this.isInDateRange &&
           this.failureCount < this.maxFailures &&
           (!this.maxExecutions || this.executionCount < this.maxExecutions);
  }

  get consecutiveFailures(): number {
    return this.failureCount;
  }

  get successRate(): number {
    if (this.executionCount === 0) return 0;
    const successCount = this.executionCount - this.failureCount;
    return (successCount / this.executionCount) * 100;
  }

  get averageExecutionTime(): number | null {
    // This would need to be calculated from related executions
    return null;
  }

  get status(): 'active' | 'inactive' | 'expired' | 'failed' | 'completed' {
    if (this.isExpired) return 'expired';
    if (!this.isActive) return 'inactive';
    if (this.failureCount >= this.maxFailures) return 'failed';
    if (this.maxExecutions && this.executionCount >= this.maxExecutions) return 'completed';
    return 'active';
  }
}
