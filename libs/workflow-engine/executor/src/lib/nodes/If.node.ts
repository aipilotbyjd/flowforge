import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';

export class IfNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'If',
    name: 'if',
    icon: 'fa:map-signs',
    group: ['transform'],
    version: 1,
    description: 'Route items based on conditions',
    defaults: {
      name: 'If',
      color: '#408000',
    },
    inputs: ['main'],
    outputs: ['main', 'main'],
    outputNames: ['true', 'false'],
    properties: [
      {
        displayName: 'Conditions',
        name: 'conditions',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        description: 'The conditions to check',
        default: {},
        options: [
          {
            name: 'condition',
            displayName: 'Condition',
            values: [
              {
                displayName: 'Value 1',
                name: 'value1',
                type: 'string',
                default: '',
                description: 'The first value to compare',
              },
              {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                  {
                    name: 'Equal',
                    value: 'equal',
                  },
                  {
                    name: 'Not Equal',
                    value: 'notEqual',
                  },
                  {
                    name: 'Smaller',
                    value: 'smaller',
                  },
                  {
                    name: 'Smaller Equal',
                    value: 'smallerEqual',
                  },
                  {
                    name: 'Larger',
                    value: 'larger',
                  },
                  {
                    name: 'Larger Equal',
                    value: 'largerEqual',
                  },
                  {
                    name: 'Contains',
                    value: 'contains',
                  },
                  {
                    name: 'Not Contains',
                    value: 'notContains',
                  },
                  {
                    name: 'Starts With',
                    value: 'startsWith',
                  },
                  {
                    name: 'Ends With',
                    value: 'endsWith',
                  },
                  {
                    name: 'Is Empty',
                    value: 'isEmpty',
                  },
                  {
                    name: 'Is Not Empty',
                    value: 'isNotEmpty',
                  },
                ],
                default: 'equal',
                description: 'Operation to decide where the the data should be mapped to',
              },
              {
                displayName: 'Value 2',
                name: 'value2',
                type: 'string',
                displayOptions: {
                  hide: {
                    operation: ['isEmpty', 'isNotEmpty'],
                  },
                },
                default: '',
                description: 'The second value to compare with the first one',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Combine',
        name: 'combineOperation',
        type: 'options',
        options: [
          {
            name: 'ALL',
            value: 'all',
            description: 'Only if all conditions are met it goes to "true" output',
          },
          {
            name: 'ANY',
            value: 'any',
            description: 'If any condition is met it goes to "true" output',
          },
        ],
        default: 'all',
        description: 'If multiple conditions are defined how to combine them',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const returnDataTrue: INodeExecutionData[] = [];
    const returnDataFalse: INodeExecutionData[] = [];

    const items = this.getInputData();

    let item: INodeExecutionData;
    let combineOperation: string;

    const conditions = this.getNodeParameter('conditions.condition', 0, []) as Array<{
      value1: string;
      operation: string;
      value2: string;
    }>;

    // The compare operations
    const compareOperationFunctions: {
      [key: string]: (value1: string | number, value2: string | number) => boolean;
    } = {
      contains: (value1: string | number, value2: string | number) => (value1 || '').toString().includes((value2 || '').toString()),
      notContains: (value1: string | number, value2: string | number) => !(value1 || '').toString().includes((value2 || '').toString()),
      endsWith: (value1: string | number, value2: string | number) => (value1 || '').toString().endsWith((value2 || '').toString()),
      equal: (value1: string | number, value2: string | number) => value1 === value2,
      notEqual: (value1: string | number, value2: string | number) => value1 !== value2,
      larger: (value1: string | number, value2: string | number) => (value1 || 0) > (value2 || 0),
      largerEqual: (value1: string | number, value2: string | number) => (value1 || 0) >= (value2 || 0),
      smaller: (value1: string | number, value2: string | number) => (value1 || 0) < (value2 || 0),
      smallerEqual: (value1: string | number, value2: string | number) => (value1 || 0) <= (value2 || 0),
      startsWith: (value1: string | number, value2: string | number) => (value1 || '').toString().startsWith((value2 || '').toString()),
      isEmpty: (value1: string | number) => [undefined, null, ''].includes(value1 as string),
      isNotEmpty: (value1: string | number) => ![undefined, null, ''].includes(value1 as string),
    };

    // Iterate over all items to check which ones should be output as via "true" and
    // which ones via "false"
    let dataResultsTrue: boolean;
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      item = items[itemIndex];
      combineOperation = this.getNodeParameter('combineOperation', itemIndex) as string;

      dataResultsTrue = false;

      // Check all the values of the different conditions
      const conditionResults: boolean[] = [];

      let compareOperationResult: boolean;
      conditions.forEach((condition) => {
        // Resolve the values to compare
        const value1 = this.resolveValue(condition.value1, item);
        const value2 = this.resolveValue(condition.value2, item);

        compareOperationResult = compareOperationFunctions[condition.operation](value1, value2);
        conditionResults.push(compareOperationResult);
      });

      if (combineOperation === 'all') {
        dataResultsTrue = conditionResults.every((result) => result === true);
      } else {
        dataResultsTrue = conditionResults.some((result) => result === true);
      }

      if (dataResultsTrue === true) {
        returnDataTrue.push(item);
      } else {
        returnDataFalse.push(item);
      }
    }

    return [returnDataTrue, returnDataFalse];
  }

  private resolveValue(value: string, item: INodeExecutionData): string | number {
    // Simple resolution - in a real implementation, this would handle expressions
    if (value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.slice(2, -2).trim();
      const pathParts = path.split('.');
      
      let result: any = item.json;
      for (const part of pathParts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          return '';
        }
      }
      
      return result;
    }
    
    return value;
  }
}
