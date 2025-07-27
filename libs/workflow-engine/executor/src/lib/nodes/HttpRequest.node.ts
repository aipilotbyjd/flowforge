import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';

export class HttpRequestNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'HTTP Request',
    name: 'httpRequest',
    icon: 'fa:at',
    group: ['output'],
    version: 1,
    description: 'Makes an HTTP request and returns the response data',
    defaults: {
      name: 'HTTP Request',
      color: '#54B399',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'httpBasicAuth',
        required: false,
      },
      {
        name: 'httpHeaderAuth',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
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
        default: 'GET',
        description: 'The request method to use',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        placeholder: 'https://api.example.com/users',
        required: true,
        description: 'The URL to make the request to',
      },
      {
        displayName: 'Send Body',
        name: 'sendBody',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            method: ['POST', 'PUT', 'PATCH'],
          },
        },
      },
      {
        displayName: 'Body Content Type',
        name: 'bodyContentType',
        type: 'options',
        displayOptions: {
          show: {
            sendBody: [true],
          },
        },
        options: [
          {
            name: 'JSON',
            value: 'json',
          },
          {
            name: 'Form-Data Multipart',
            value: 'multipart-form-data',
          },
          {
            name: 'Form Encoded',
            value: 'form-urlencoded',
          },
          {
            name: 'Raw/Custom',
            value: 'raw',
          },
        ],
        default: 'json',
      },
      {
        displayName: 'JSON',
        name: 'jsonParameters',
        type: 'json',
        displayOptions: {
          show: {
            bodyContentType: ['json'],
            sendBody: [true],
          },
        },
        default: '{\n  "key": "value"\n}',
      },
      {
        displayName: 'Query Parameters',
        name: 'queryParametersUi',
        placeholder: 'Add Parameter',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Parameter',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Headers',
        name: 'headersUi',
        placeholder: 'Add Header',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'parameter',
            displayName: 'Header',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Response Format',
        name: 'responseFormat',
        type: 'options',
        options: [
          {
            name: 'Autodetect',
            value: 'autodetect',
          },
          {
            name: 'JSON',
            value: 'json',
          },
          {
            name: 'String',
            value: 'string',
          },
        ],
        default: 'autodetect',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const method = this.getNodeParameter('method', itemIndex) as string;
        const url = this.getNodeParameter('url', itemIndex) as string;
        const sendBody = this.getNodeParameter('sendBody', itemIndex, false) as boolean;
        const bodyContentType = this.getNodeParameter('bodyContentType', itemIndex) as string;
        const responseFormat = this.getNodeParameter('responseFormat', itemIndex) as string;

        const options: any = {
          method,
          url,
          headers: {},
        };

        // Add query parameters
        const queryParameters = this.getNodeParameter('queryParametersUi.parameter', itemIndex, []) as Array<{
          name: string;
          value: string;
        }>;
        
        if (queryParameters.length > 0) {
          const params = new URLSearchParams();
          queryParameters.forEach(param => {
            params.append(param.name, param.value);
          });
          options.url += `?${params.toString()}`;
        }

        // Add headers
        const headers = this.getNodeParameter('headersUi.parameter', itemIndex, []) as Array<{
          name: string;
          value: string;
        }>;
        
        headers.forEach(header => {
          options.headers[header.name] = header.value;
        });

        // Add body if needed
        if (sendBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
          if (bodyContentType === 'json') {
            const jsonParameters = this.getNodeParameter('jsonParameters', itemIndex) as string;
            options.body = JSON.parse(jsonParameters);
            options.headers['Content-Type'] = 'application/json';
          }
        }

        const response = await this.helpers.httpRequest(options);
        
        let responseData;
        if (responseFormat === 'json') {
          responseData = typeof response === 'string' ? JSON.parse(response) : response;
        } else if (responseFormat === 'string') {
          responseData = typeof response === 'object' ? JSON.stringify(response) : response;
        } else {
          // Autodetect
          responseData = response;
        }

        returnData.push({
          json: {
            data: responseData,
            statusCode: response.statusCode || 200,
            headers: response.headers || {},
          },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              statusCode: error.statusCode || 500,
            },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
