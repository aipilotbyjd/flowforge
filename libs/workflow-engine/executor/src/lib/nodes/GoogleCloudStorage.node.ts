import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import { Storage } from '@google-cloud/storage';

export class GoogleCloudStorageNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Google Cloud Storage',
    name: 'googleCloudStorage',
    icon: 'file:google-cloud.svg',
    group: ['transform'],
    version: 1,
    description: 'Work with Google Cloud Storage',
    defaults: {
      name: 'Google Cloud Storage',
      color: '#1a73e8',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'googleCloud',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Upload',
            value: 'upload',
            description: 'Upload a file to Google Cloud Storage',
          },
          {
            name: 'Download',
            value: 'download',
            description: 'Download a file from Google Cloud Storage',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a file from Google Cloud Storage',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List files in Google Cloud Storage',
          },
        ],
        default: 'upload',
        description: 'The operation to perform',
      },
      {
        displayName: 'Bucket Name',
        name: 'bucketName',
        type: 'string',
        default: '',
        placeholder: 'my-bucket',
        required: true,
        description: 'Name of the Google Cloud Storage bucket',
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        default: '',
        placeholder: 'file.txt',
        description: 'The name of the file to upload/download/delete',
        displayOptions: {
          show: {
            operation: ['upload', 'download', 'delete'],
          },
        },
      },
      {
        displayName: 'File Data',
        name: 'fileData',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['upload'],
          },
        },
        default: '',
        placeholder: 'Base64 encoded file data',
        description: 'Base64 encoded data to upload',
      },
      {
        displayName: 'Prefix',
        name: 'prefix',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['list'],
          },
        },
        default: '',
        placeholder: 'folder/',
        description: 'The prefix of files to list',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;

        // Initialize storage client
        const googleCloudCredentials = await this.getCredentials('googleCloud');
        const storage = new Storage({
          projectId: googleCloudCredentials.projectId,
          credentials: googleCloudCredentials,
        });

        const bucket = storage.bucket(bucketName);

        if (operation === 'upload') {
          const fileName = this.getNodeParameter('fileName', itemIndex) as string;
          const fileData = this.getNodeParameter('fileData', itemIndex) as string;
          const buffer = Buffer.from(fileData, 'base64');

          await bucket.file(fileName).save(buffer);

          returnData.push({
            json: {
              operation: 'upload',
              status: 'success',
              fileName,
              bucketName,
            },
          });
        } else if (operation === 'download') {
          const fileName = this.getNodeParameter('fileName', itemIndex) as string;
          const [fileBuffer] = await bucket.file(fileName).download();

          returnData.push({
            json: {
              operation: 'download',
              status: 'success',
              fileName,
              bucketName,
              fileData: fileBuffer.toString('base64'),
            },
          });
        } else if (operation === 'delete') {
          const fileName = this.getNodeParameter('fileName', itemIndex) as string;
          await bucket.file(fileName).delete();

          returnData.push({
            json: {
              operation: 'delete',
              status: 'success',
              fileName,
              bucketName,
            },
          });
        } else if (operation === 'list') {
          const prefix = this.getNodeParameter('prefix', itemIndex) as string;
          const [files] = await bucket.getFiles({ prefix });

          returnData.push({
            json: {
              operation: 'list',
              status: 'success',
              bucketName,
              files: files.map(file => ({
                name: file.name,
                size: file.metadata.size,
              })),
            },
          });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              status: 'failed',
            },
          });
          continue;
        }
        throw new Error(`Google Cloud Storage operation failed: ${error.message}`);
      }
    }

    return [returnData];
  }
}

