import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';

export enum NodeExecutionStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
  WAITING = 'waiting',
  DISABLED = 'disabled',
}

@Entity('node_executions')
@Index(['workflowExecutionId', 'nodeId'])
@Index(['status', 'startTime'])
@Index(['nodeType'])
export class NodeExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_execution_id' })
  workflowExecutionId: string;

  @ManyToOne(() => WorkflowExecution, workflowExecution => workflowExecution.nodeExecutions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_execution_id' })
  workflowExecution: WorkflowExecution;

  @Column({ name: 'node_id', comment: 'The ID of the node in the workflow definition' })
  nodeId: string;

  @Column({ name: 'node_name', comment: 'Display name of the node' })
  nodeName: string;

  @Column({ name: 'node_type', comment: 'Type of the node (e.g., HttpRequest, Set, If)' })
  nodeType: string;

  @Column({
    type: 'enum',
    enum: NodeExecutionStatus,
    default: NodeExecutionStatus.QUEUED,
  })
  status: NodeExecutionStatus;

  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'execution_time', type: 'integer', nullable: true, comment: 'Execution time in milliseconds' })
  executionTime: number;

  @Column({ type: 'jsonb', nullable: true, comment: 'Input data passed to the node' })
  inputData: any;

  @Column({ type: 'jsonb', nullable: true, comment: 'Output data produced by the node' })
  outputData: any;

  @Column({ type: 'jsonb', nullable: true, comment: 'Node configuration/parameters at execution time' })
  nodeParameters: any;

  @Column({ type: 'jsonb', nullable: true, comment: 'Error details if node execution failed' })
  errorData: any;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'integer', default: 0 })
  maxRetries: number;

  @Column({ name: 'wait_till', type: 'timestamp', nullable: true, comment: 'For waiting nodes' })
  waitTill: Date;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional execution metadata' })
  metadata: {
    credentialId?: string;
    webhookResponseCode?: number;
    httpStatusCode?: number;
    itemIndex?: number;
    continueOnFail?: boolean;
    runIndex?: number;
    [key: string]: any;
  };

  @Column({ name: 'memory_usage', type: 'bigint', nullable: true, comment: 'Memory usage in bytes' })
  memoryUsage: number;

  @Column({ name: 'cpu_time', type: 'integer', nullable: true, comment: 'CPU time in milliseconds' })
  cpuTime: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get duration(): number | null {
    if (!this.startTime || !this.endTime) return null;
    return this.endTime.getTime() - this.startTime.getTime();
  }

  get isFinished(): boolean {
    return [
      NodeExecutionStatus.SUCCESS, 
      NodeExecutionStatus.ERROR, 
      NodeExecutionStatus.SKIPPED, 
      NodeExecutionStatus.DISABLED
    ].includes(this.status);
  }

  get isRunning(): boolean {
    return [NodeExecutionStatus.QUEUED, NodeExecutionStatus.RUNNING, NodeExecutionStatus.WAITING].includes(this.status);
  }

  get canRetry(): boolean {
    return this.status === NodeExecutionStatus.ERROR && this.retryCount < this.maxRetries;
  }

  get hasError(): boolean {
    return this.status === NodeExecutionStatus.ERROR && !!this.errorMessage;
  }
}
