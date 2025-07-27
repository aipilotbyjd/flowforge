import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';

export class ManualTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Manual Trigger',
    name: 'manualTrigger',
    icon: 'fa:play-circle',
    group: ['trigger'],
    version: 1,
    description: 'Runs the workflow when started manually',
    defaults: {
      name: 'Manual Trigger',
      color: '#909298',
    },
    inputs: [],
    outputs: ['main'],
    properties: [
      {
        displayName: 'This node is where a manual workflow execution starts. You can click "Execute Workflow" to trigger it.',
        name: 'notice',
        type: 'notice',
        default: '',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const mode = this.getMode();

    if (mode === 'manual') {
      // For manual execution, return a simple trigger object
      return [
        [
          {
            json: {
              timestamp: new Date().toISOString(),
              executionId: this.getExecutionId(),
              workflowId: this.getWorkflowId(),
              nodeId: this.getNodeId(),
              mode: 'manual',
            },
          },
        ],
      ];
    }

    // For other modes, return empty (this should not happen for manual trigger)
    return [[]];
  }
}
