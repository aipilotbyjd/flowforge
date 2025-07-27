import { WorkflowStatus } from '../enums/workflow-status.enum';

export interface WorkflowEntity {
  id: string;
  name: string;
  description?: string;
  nodes: any[]; // Will be properly typed when node interfaces are defined
  connections: any[]; // Will be properly typed when node interfaces are defined
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

