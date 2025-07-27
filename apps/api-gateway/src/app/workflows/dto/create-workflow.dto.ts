import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsObject,
  MinLength,
  MaxLength,
  ArrayMinSize 
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowNodeDto } from './workflow-node.dto';
import { NodeConnectionDto } from './node-connection.dto';

export class WorkflowSettingsDto {
  @ApiPropertyOptional({ 
    description: 'Error workflow ID to execute on failure',
    example: 'wf_error_handler_123' 
  })
  @IsOptional()
  @IsString()
  errorWorkflowId?: string;

  @ApiPropertyOptional({ 
    description: 'Timezone for the workflow execution',
    example: 'UTC',
    default: 'UTC'
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ 
    description: 'Whether to save manual executions',
    example: true,
    default: true
  })
  @IsOptional()
  saveManualExecutions?: boolean;

  @ApiPropertyOptional({ 
    description: 'Whether to save execution progress',
    example: true,
    default: false
  })
  @IsOptional()
  saveExecutionProgress?: boolean;

  @ApiPropertyOptional({ 
    description: 'Timeout in milliseconds for workflow execution',
    example: 300000,
    default: 300000
  })
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum number of execution steps allowed',
    example: 1000,
    default: 1000
  })
  @IsOptional()
  maxExecutionSteps?: number;
}

export class CreateWorkflowDto {
  @ApiProperty({ 
    description: 'Name of the workflow',
    example: 'Customer Onboarding Workflow',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @MinLength(1, { message: 'Workflow name cannot be empty' })
  @MaxLength(255, { message: 'Workflow name cannot exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({ 
    description: 'Description of the workflow',
    example: 'Automated workflow for onboarding new customers',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({ 
    description: 'Array of nodes in the workflow',
    type: [WorkflowNodeDto],
    example: [
      {
        id: 'node_1',
        name: 'Start',
        type: 'start',
        parameters: {},
        position: { x: 100, y: 100 },
        disabled: false
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Workflow must have at least one node' })
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiProperty({ 
    description: 'Array of connections between nodes',
    type: [NodeConnectionDto],
    example: [
      {
        id: 'conn_1',
        sourceNodeId: 'node_1',
        sourceOutputKey: 'output',
        targetNodeId: 'node_2',
        targetInputKey: 'input'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeConnectionDto)
  connections: NodeConnectionDto[];

  @ApiPropertyOptional({ 
    description: 'Workflow settings and configuration',
    type: WorkflowSettingsDto
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkflowSettingsDto)
  settings?: WorkflowSettingsDto;
}
