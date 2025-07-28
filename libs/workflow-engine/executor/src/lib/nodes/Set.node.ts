import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';

export class SetNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Set',
    name: 'set',
    icon: 'fa:pen-square',
    group: ['input'],
    version: 1,
    description: 'Sets values for the workflow execution',
    defaults: {
      name: 'Set',
      color: '#00E8A2',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Values to Set',
        name: 'values',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'string',
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData();
    const returnItems = [];
    const items = this.getNodeParameter('values.string', []) as Array<{
      name: string;
      value: string;
    }>;

    for (let itemIndex = 0; itemIndex < inputData.length; itemIndex++) {
      const newItem = { ...inputData[itemIndex].json };

      for (const item of items) {
        newItem[item.name] = item.value;
      }

      returnItems.push({ json: newItem });
    }

    // Return as INodeExecutionData[][]
    const nodeExecutionData: INodeExecutionData = {
      data: {
        main: [returnItems]
      }
    };

    return [[nodeExecutionData]];
  }
}
