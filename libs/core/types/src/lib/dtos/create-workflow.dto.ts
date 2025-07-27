import { WorkflowSettings } from '../interfaces/workflow.interface';

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  nodes: WorkflowNodeDto[];
  connections: NodeConnectionDto[];
  settings?: WorkflowSettings;
}

export interface WorkflowNodeDto {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  position: { x: number; y: number };
  disabled?: boolean;
}

export interface NodeConnectionDto {
  id: string;
  sourceNodeId: string;
  sourceOutputKey: string;
  targetNodeId: string;
  targetInputKey: string;
  conditions?: any[];
}
