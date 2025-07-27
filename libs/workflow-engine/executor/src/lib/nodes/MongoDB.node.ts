import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import { MongoClient } from 'mongodb';

export class MongoDBNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MongoDB',
    name: 'mongodb',
    icon: 'fa:database',
    group: ['transform'],
    version: 1,
    description: 'Connects to a MongoDB database and executes operations',
    defaults: {
      name: 'MongoDB',
      color: '#47A248',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Action',
        name: 'action',
        type: 'options',
        options: [
          {
            name: 'Find',
            value: 'find',
          },
          {
            name: 'Insert',
            value: 'insert',
          },
          {
            name: 'Update',
            value: 'update',
          },
          {
            name: 'Delete',
            value: 'delete',
          },
        ],
        default: 'find',
        description: 'The operation to perform on the collection',
      },
      {
        displayName: 'Collection',
        name: 'collection',
        type: 'string',
        default: '',
        placeholder: 'Collection name',
        required: true,
      },
      {
        displayName: 'Database Connection',
        name: 'connection',
        type: 'json',
        default: '{}',
        placeholder: '{ "url": "mongodb://localhost:27017", "dbName": "mydb" }',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'json',
        default: '{}',
        description: 'The query or data to use for the operation',
      },
      {
        displayName: 'Update Operations',
        name: 'updateOps',
        type: 'json',
        displayOptions: {
          show: {
            action: ['update'],
          },
        },
        default: '{}',
        description: 'The update operations to apply',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const action = this.getNodeParameter('action', 0) as string;
    const collectionName = this.getNodeParameter('collection', 0) as string;
    const connection = JSON.parse(this.getNodeParameter('connection', 0) as string);
    const query = JSON.parse(this.getNodeParameter('query', 0) as string);
    const updateOps = JSON.parse(this.getNodeParameter('updateOps', 0) as string);

    const client = new MongoClient(connection.url);

    try {
      await client.connect();
      const db = client.db(connection.dbName);
      const collection = db.collection(collectionName);

      let result;
      switch (action) {
        case 'find':
          result = await collection.find(query).toArray();
          break;
        case 'insert':
          result = await collection.insertMany(Array.isArray(query) ? query : [query]);
          break;
        case 'update':
          result = await collection.updateMany(query, updateOps);
          break;
        case 'delete':
          result = await collection.deleteMany(query);
          break;
      }

      returnData.push({ json: result });
    } catch (error) {
      throw new Error(`MongoDB error: ${error.message}`);
    } finally {
      await client.close();
    }

    return [returnData];
  }
}
