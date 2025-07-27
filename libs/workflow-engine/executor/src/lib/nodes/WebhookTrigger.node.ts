import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';

export class WebhookTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Webhook Trigger',
    name: 'webhookTrigger',
    icon: 'fa:globe',
    group: ['trigger'],
    version: 1,
    description: 'Starts the workflow when a webhook is called',
    defaults: {
      name: 'Webhook Trigger',
      color: '#885577',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'HTTP Method',
        name: 'httpMethod',
        type: 'options',
        options: [
          {
            name: 'GET',
            value: 'GET',
          },
          {
            name: 'POST',
            value: 'POST',
          },
          {
            name: 'PUT',
            value: 'PUT',
          },
          {
            name: 'DELETE',
            value: 'DELETE',
          },
          {
            name: 'PATCH',
            value: 'PATCH',
          },
          {
            name: 'HEAD',
            value: 'HEAD',
          },
          {
            name: 'OPTIONS',
            value: 'OPTIONS',
          },
        ],
        default: 'POST',
        description: 'The HTTP method to listen for',
      },
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: 'webhook',
        placeholder: 'webhook',
        required: true,
        description: 'The path for the webhook URL',
      },
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        options: [
          {
            name: 'On Received',
            value: 'onReceived',
            description: 'Returns response immediately when webhook is received',
          },
          {
            name: 'Last Node',
            value: 'lastNode',
            description: 'Returns response from the last executed node',
          },
        ],
        default: 'onReceived',
        description: 'When to return the response',
      },
      {
        displayName: 'Response Code',
        name: 'responseCode',
        type: 'number',
        typeOptions: {
          minValue: 100,
          maxValue: 599,
        },
        default: 200,
        description: 'The HTTP response code to return',
      },
      {
        displayName: 'Response Data',
        name: 'responseData',
        type: 'string',
        displayOptions: {
          show: {
            responseMode: ['onReceived'],
          },
        },
        default: 'success',
        description: 'The data to return in the response',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // This method is called when the webhook is triggered
    // In a real implementation, the webhook data would be passed in
    
    const mode = this.getMode();
    
    if (mode === 'webhook') {
      // For webhook mode, return the webhook data
      // This would typically come from the webhook handler
      return [
        [
          {
            json: {
              webhookTriggered: true,
              timestamp: new Date().toISOString(),
              method: this.getNodeParameter('httpMethod'),
              path: this.getNodeParameter('path'),
              executionId: this.getExecutionId(),
              workflowId: this.getWorkflowId(),
              nodeId: this.getNodeId(),
              // In real implementation, these would contain actual webhook data:
              headers: {},
              query: {},
              body: {},
            },
          },
        ],
      ];
    }

    // For manual mode, return test data
    return [
      [
        {
          json: {
            webhookTriggered: false,
            timestamp: new Date().toISOString(),
            mode: 'test',
            message: 'This is test data. Configure a webhook to receive real data.',
            executionId: this.getExecutionId(),
            workflowId: this.getWorkflowId(),
            nodeId: this.getNodeId(),
          },
        },
      ],
    ];
  }
}
