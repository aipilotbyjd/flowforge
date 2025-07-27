export interface ExecuteWorkflowDto {
  inputData?: Record<string, any>;
  startNodeId?: string;
  saveExecution?: boolean;
  executionSettings?: ExecutionSettings;
}

export interface ExecutionSettings {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  skipOnError?: boolean;
  saveProgress?: boolean;
}
