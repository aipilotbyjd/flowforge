export enum ExecutionStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  PAUSED = 'paused',
}

export enum WorkflowExecutionStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  PAUSED = 'paused',
}

export enum WorkflowExecutionMode {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  TRIGGER = 'trigger'
}
