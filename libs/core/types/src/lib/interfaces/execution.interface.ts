import { ExecutionStatus } from '../enums/execution-status.enum';

export interface ExecutionEntity {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;
  retryCount: number;
}

