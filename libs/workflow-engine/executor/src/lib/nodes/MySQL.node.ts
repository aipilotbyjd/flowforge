import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import * as mysql from 'mysql2/promise';

export class MySQLNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MySQL',
    name: 'mysql',
    icon: 'fa:database',
    group: ['transform'],
    version: 1,
    description: 'Connects to a MySQL database and executes queries',
    defaults: {
      name: 'MySQL',
      color: '#00758F',
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
        required: true,
      },
      {
        displayName: 'Host',
        name: 'host',
        type: 'string',
        default: 'localhost',
        placeholder: 'Database host',
        required: true,
      },
      {
        displayName: 'Port',
        name: 'port',
        type: 'number',
        default: 3306,
        placeholder: 'Database port',
      },
      {
        displayName: 'Database',
        name: 'database',
        type: 'string',
        default: '',
        placeholder: 'Database name',
        required: true,
      },
      {
        displayName: 'Username',
        name: 'user',
        type: 'string',
        default: '',
        placeholder: 'Database username',
        required: true,
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        default: '',
        placeholder: 'Database password',
        typeOptions: {
          password: true,
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const query = this.getNodeParameter('query', itemIndex) as string;
        const host = this.getNodeParameter('host', itemIndex) as string;
        const port = this.getNodeParameter('port', itemIndex) as number;
        const database = this.getNodeParameter('database', itemIndex) as string;
        const user = this.getNodeParameter('user', itemIndex) as string;
        const password = this.getNodeParameter('password', itemIndex) as string;

        // Create MySQL connection
        const connection = await mysql.createConnection({
          host,
          port,
          user,
          password,
          database,
        });

        try {
          const [rows, fields] = await connection.execute(query);
          
          returnData.push({
            json: {
              query,
              result: rows,
              rowCount: Array.isArray(rows) ? rows.length : 0,
              fields: fields?.map(field => ({
                name: field.name,
                type: field.type,
              })) || [],
            },
          });
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              json: {
                error: error.message,
                query,
              },
            });
          } else {
            throw new Error(`MySQL query error: ${error.message}`);
          }
        } finally {
          await connection.end();
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
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
