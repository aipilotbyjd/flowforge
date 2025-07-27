// Basic types for workflow executor

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  WAITING = 'waiting',
  RETRYING = 'retrying'
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  ERROR = 'error'
}

export enum NodeType {
  START = 'start',
  END = 'end',
  HTTP_REQUEST = 'http_request',
  WEBHOOK = 'webhook',
  SET = 'set',
  IF = 'if',
  SWITCH = 'switch',
  MERGE = 'merge'
}

export interface WorkflowEntity {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  settings: WorkflowSettings;
  status: WorkflowStatus;
  version: number;
  versionId: string;
  createdBy: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowSettings {
  errorWorkflowId?: string;
  timezone?: string;
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  timeout?: number;
  maxExecutionSteps?: number;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  parameters: Record<string, any>;
  position: { x: number; y: number };
  disabled?: boolean;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputKey: string;
  targetNodeId: string;
  targetInputKey: string;
}

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

export interface NodeExecutionResult {
  nodeId: string;
  status: ExecutionStatus;
  outputData?: Record<string, any>;
  error?: string;
  startTime: Date;
  endTime?: Date;
  logs?: string[];
}
