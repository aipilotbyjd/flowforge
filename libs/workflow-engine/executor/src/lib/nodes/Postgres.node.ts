import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import { Client } from 'pg';

export class PostgresNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'PostgreSQL',
    name: 'postgres',
    icon: 'fa:database',
    group: ['transform'],
    version: 1,
    description: 'Connects to a PostgreSQL database and executes queries',
    defaults: {
      name: 'PostgreSQL',
      color: '#336791',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        default: 'SELECT * FROM my_table;',
        placeholder: 'SQL query to execute',
      },
      {
        displayName: 'Database Connection',
        name: 'connection',
        type: 'json',
        default: '{}',
        placeholder: '{ "user": "", "host": "", "database": "", "password": "", "port": 5432 }',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const query = this.getNodeParameter('query', 0) as string;
    const connection = JSON.parse(this.getNodeParameter('connection', 0) as string);

    // Create PostgreSQL client
    const client = new Client(connection);
    await client.connect();

    try {
      const result = await client.query(query);
      returnData.push({ json: { result: result.rows } });
    } catch (error) {
      throw new Error(`PostgreSQL error: ${error.message}`);
    } finally {
      await client.end();
    }

    return [returnData];
  }
}
