import { NodeType } from '../enums/node-type.enum';
import { ExecutionStatus } from '../enums/execution-status.enum';

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  parameters: Record<string, any>;
  position: { x: number; y: number };
  disabled?: boolean;
  metadata?: NodeMetadata;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputKey: string;
  targetNodeId: string;
  targetInputKey: string;
  conditions?: ConnectionCondition[];
}

export interface NodeMetadata {
  description?: string;
  notes?: string;
  tags?: string[];
  color?: string;
  icon?: string;
}

export interface ConnectionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface NodeDefinition {
  type: NodeType;
  name: string;
  description: string;
  category: string;
  icon: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: NodeParameter[];
}

export interface NodeInput {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

export interface NodeOutput {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

export interface NodeParameter {
  key: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'text' | 'json';
  required: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  description?: string;
  placeholder?: string;
}

export interface NodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  inputData: Record<string, any>;
  globalData: Record<string, any>;
  settings: NodeExecutionSettings;
}

export interface NodeExecutionSettings {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipOnError?: boolean;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: ExecutionStatus;
  outputData?: Record<string, any>;
  error?: string;
  startTime: Date;
  endTime?: Date;
  logs?: string[];
  metrics?: NodeExecutionMetrics;
}

export interface NodeExecutionMetrics {
  executionTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}
