import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { Workflow } from './workflow.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { NodeExecution } from './node-execution.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export enum ExecutionMode {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULED = 'scheduled',
  ERROR_WORKFLOW = 'error_workflow',
  RETRY = 'retry'
}

@Entity('workflow_executions')
@Index(['organizationId', 'status'])
@Index(['workflowId', 'status'])
@Index(['startedAt'])
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'workflow_id' })
  workflowId: string;

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @Column({ type: 'enum', enum: ExecutionMode, default: ExecutionMode.MANUAL })
  mode: ExecutionMode;

  @Column({ type: 'jsonb', nullable: true, name: 'input_data' })
  inputData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'output_data' })
  outputData?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'node_execution_data' })
  nodeExecutionData?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'finished_at' })
  finishedAt?: Date;

  @Column({ type: 'integer', nullable: true, name: 'duration_ms' })
  durationMs?: number;

  @Column({ type: 'bigint', nullable: true, name: 'memory_peak' })
  memoryPeak?: number;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true, name: 'triggered_by' })
  triggeredById?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'webhook_url' })
  webhookUrl?: string;

  @Column({ type: 'boolean', default: false, name: 'is_manual' })
  isManual: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Workflow, workflow => workflow.executions)
  workflow: Workflow;

  @ManyToOne(() => User, user => user.executionsTriggered, { nullable: true })
  triggeredBy?: User;

  @ManyToOne(() => Organization, organization => organization.workflowExecutions)
  organization: Organization;

  @OneToMany(() => NodeExecution, nodeExecution => nodeExecution.workflowExecution)
  nodeExecutions: NodeExecution[];

  // Virtual properties
  get duration(): number | null {
    if (this.startedAt && this.finishedAt) {
      return this.finishedAt.getTime() - this.startedAt.getTime();
    }
    return null;
  }

  get isCompleted(): boolean {
    return [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED, ExecutionStatus.TIMEOUT].includes(this.status);
  }

  get isRunning(): boolean {
    return this.status === ExecutionStatus.RUNNING;
  }

  get hasError(): boolean {
    return this.status === ExecutionStatus.FAILED && !!this.error;
  }
}
