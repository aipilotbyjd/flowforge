import { WorkflowNodeDto, NodeConnectionDto } from './create-workflow.dto';
import { WorkflowSettings } from '../interfaces/workflow.interface';
import { WorkflowStatus } from '../enums/workflow-status.enum';

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  nodes?: WorkflowNodeDto[];
  connections?: NodeConnectionDto[];
  settings?: WorkflowSettings;
  status?: WorkflowStatus;
}
