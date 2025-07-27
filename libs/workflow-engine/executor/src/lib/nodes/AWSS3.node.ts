import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export class AWSS3Node implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'AWS S3',
    name: 'awsS3',
    icon: 'file:s3.svg',
    group: ['transform'],
    version: 1,
    description: 'Work with AWS S3 buckets',
    defaults: {
      name: 'AWS S3',
      color: '#FF9900',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'aws',
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
            description: 'Upload a file to S3',
          },
          {
            name: 'Download',
            value: 'download',
            description: 'Download a file from S3',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a file from S3',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List files in an S3 bucket',
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
        description: 'Name of the S3 bucket',
      },
      {
        displayName: 'File Key',
        name: 'fileKey',
        type: 'string',
        default: '',
        placeholder: 'path/to/file.txt',
        displayOptions: {
          show: {
            operation: ['upload', 'download', 'delete'],
          },
        },
        required: true,
        description: 'The key (path) of the file in S3',
      },
      {
        displayName: 'File Content',
        name: 'fileContent',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        displayOptions: {
          show: {
            operation: ['upload'],
          },
        },
        required: true,
        description: 'Content of the file to upload (use base64 for binary files)',
      },
      {
        displayName: 'Content Type',
        name: 'contentType',
        type: 'string',
        default: 'text/plain',
        displayOptions: {
          show: {
            operation: ['upload'],
          },
        },
        description: 'MIME type of the file',
      },
      {
        displayName: 'Prefix',
        name: 'prefix',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['list'],
          },
        },
        description: 'Filter objects by prefix',
      },
      {
        displayName: 'Max Keys',
        name: 'maxKeys',
        type: 'number',
        default: 1000,
        displayOptions: {
          show: {
            operation: ['list'],
          },
        },
        description: 'Maximum number of keys to return',
      },
      {
        displayName: 'AWS Configuration',
        name: 'awsConfig',
        type: 'json',
        default: '{\n  "region": "us-east-1",\n  "accessKeyId": "your-access-key",\n  "secretAccessKey": "your-secret-key"\n}',
        description: 'AWS configuration (will be overridden by credentials)',
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
        const awsConfig = JSON.parse(this.getNodeParameter('awsConfig', itemIndex) as string);

        // Create S3 client
        const s3Client = new S3Client({
          region: awsConfig.region,
          credentials: {
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey,
          },
        });

        let result: any = {};

        switch (operation) {
          case 'upload': {
            const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;
            const fileContent = this.getNodeParameter('fileContent', itemIndex) as string;
            const contentType = this.getNodeParameter('contentType', itemIndex) as string;

            const uploadCommand = new PutObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
              Body: Buffer.from(fileContent, 'base64'),
              ContentType: contentType,
            });

            const uploadResult = await s3Client.send(uploadCommand);
            
            result = {
              operation: 'upload',
              bucket: bucketName,
              key: fileKey,
              etag: uploadResult.ETag,
              success: true,
            };
            break;
          }

          case 'download': {
            const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;

            const downloadCommand = new GetObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            });

            const downloadResult = await s3Client.send(downloadCommand);
            const bodyString = await downloadResult.Body?.transformToString();

            result = {
              operation: 'download',
              bucket: bucketName,
              key: fileKey,
              content: bodyString,
              contentType: downloadResult.ContentType,
              contentLength: downloadResult.ContentLength,
              lastModified: downloadResult.LastModified,
            };
            break;
          }

          case 'delete': {
            const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;

            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            });

            await s3Client.send(deleteCommand);

            result = {
              operation: 'delete',
              bucket: bucketName,
              key: fileKey,
              success: true,
            };
            break;
          }

          case 'list': {
            const prefix = this.getNodeParameter('prefix', itemIndex) as string;
            const maxKeys = this.getNodeParameter('maxKeys', itemIndex) as number;

            const listCommand = new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: prefix || undefined,
              MaxKeys: maxKeys,
            });

            const listResult = await s3Client.send(listCommand);

            result = {
              operation: 'list',
              bucket: bucketName,
              prefix: prefix,
              objects: listResult.Contents?.map(obj => ({
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified,
                etag: obj.ETag,
              })) || [],
              totalCount: listResult.KeyCount,
              isTruncated: listResult.IsTruncated,
            };
            break;
          }
        }

        returnData.push({
          json: result,
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              operation: this.getNodeParameter('operation', itemIndex),
            },
          });
        } else {
          throw new Error(`AWS S3 operation failed: ${error.message}`);
        }
      }
    }

    return [returnData];
  }
}
