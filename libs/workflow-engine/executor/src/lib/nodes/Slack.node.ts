import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import axios from 'axios';

export class SlackNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Slack',
    name: 'slack',
    icon: 'file:slack.svg',
    group: ['output'],
    version: 1,
    description: 'Send messages and interact with Slack',
    defaults: {
      name: 'Slack',
      color: '#4A154B',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'slackApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          {
            name: 'Message',
            value: 'message',
          },
          {
            name: 'Channel',
            value: 'channel',
          },
          {
            name: 'User',
            value: 'user',
          },
        ],
        default: 'message',
        description: 'The resource to operate on',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['message'],
          },
        },
        options: [
          {
            name: 'Send',
            value: 'send',
            description: 'Send a message to a channel or user',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update an existing message',
          },
          {
            name: 'Delete',
            value: 'delete',
            description: 'Delete a message',
          },
        ],
        default: 'send',
        description: 'The operation to perform',
      },
      {
        displayName: 'Channel',
        name: 'channel',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send', 'update', 'delete'],
          },
        },
        default: '',
        placeholder: '#general or @username',
        required: true,
        description: 'Channel name or user to send the message to',
      },
      {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        typeOptions: {
          rows: 5,
        },
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send', 'update'],
          },
        },
        default: '',
        placeholder: 'Hello from FlowForge!',
        required: true,
        description: 'Text content of the message',
      },
      {
        displayName: 'Message Timestamp',
        name: 'messageTimestamp',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['update', 'delete'],
          },
        },
        default: '',
        placeholder: '1234567890.123456',
        required: true,
        description: 'Timestamp of the message to update or delete',
      },
      {
        displayName: 'Blocks',
        name: 'blocks',
        type: 'json',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send', 'update'],
          },
        },
        default: '',
        placeholder: '[{"type": "section", "text": {"type": "mrkdwn", "text": "Hello *World*"}}]',
        description: 'Slack Block Kit elements (JSON array)',
      },
      {
        displayName: 'Attachments',
        name: 'attachments',
        type: 'json',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send', 'update'],
          },
        },
        default: '',
        placeholder: '[{"color": "good", "text": "Attachment text"}]',
        description: 'Message attachments (JSON array)',
      },
      {
        displayName: 'As User',
        name: 'asUser',
        type: 'boolean',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send'],
          },
        },
        default: false,
        description: 'Send message as the authenticated user instead of bot',
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send'],
            asUser: [false],
          },
        },
        default: '',
        placeholder: 'FlowForge Bot',
        description: 'Username for the bot message',
      },
      {
        displayName: 'Icon Emoji',
        name: 'iconEmoji',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send'],
            asUser: [false],
          },
        },
        default: '',
        placeholder: ':robot_face:',
        description: 'Emoji to use as the icon for this message',
      },
      {
        displayName: 'Icon URL',
        name: 'iconUrl',
        type: 'string',
        displayOptions: {
          show: {
            resource: ['message'],
            operation: ['send'],
            asUser: [false],
          },
        },
        default: '',
        placeholder: 'https://example.com/icon.png',
        description: 'URL to an image to use as the icon for this message',
      },
      {
        displayName: 'Slack Configuration',
        name: 'slackConfig',
        type: 'json',
        default: '{\n  "token": "xoxb-your-bot-token"\n}',
        description: 'Slack API configuration',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const resource = this.getNodeParameter('resource', itemIndex) as string;
        const operation = this.getNodeParameter('operation', itemIndex) as string;
        const slackConfig = JSON.parse(this.getNodeParameter('slackConfig', itemIndex) as string);

        const headers = {
          'Authorization': `Bearer ${slackConfig.token}`,
          'Content-Type': 'application/json',
        };

        let result: any = {};

        if (resource === 'message') {
          const channel = this.getNodeParameter('channel', itemIndex) as string;

          switch (operation) {
            case 'send': {
              const text = this.getNodeParameter('text', itemIndex) as string;
              const blocks = this.getNodeParameter('blocks', itemIndex) as string;
              const attachments = this.getNodeParameter('attachments', itemIndex) as string;
              const asUser = this.getNodeParameter('asUser', itemIndex) as boolean;
              const username = this.getNodeParameter('username', itemIndex) as string;
              const iconEmoji = this.getNodeParameter('iconEmoji', itemIndex) as string;
              const iconUrl = this.getNodeParameter('iconUrl', itemIndex) as string;

              const messagePayload: any = {
                channel,
                text,
              };

              // Add blocks if provided
              if (blocks) {
                try {
                  messagePayload.blocks = JSON.parse(blocks);
                } catch (error) {
                  throw new Error('Invalid blocks JSON format');
                }
              }

              // Add attachments if provided
              if (attachments) {
                try {
                  messagePayload.attachments = JSON.parse(attachments);
                } catch (error) {
                  throw new Error('Invalid attachments JSON format');
                }
              }

              // Add bot customization options
              if (!asUser) {
                if (username) messagePayload.username = username;
                if (iconEmoji) messagePayload.icon_emoji = iconEmoji;
                if (iconUrl) messagePayload.icon_url = iconUrl;
              } else {
                messagePayload.as_user = true;
              }

              const response = await axios.post(
                'https://slack.com/api/chat.postMessage',
                messagePayload,
                { headers }
              );

              if (!response.data.ok) {
                throw new Error(`Slack API error: ${response.data.error}`);
              }

              result = {
                resource: 'message',
                operation: 'send',
                success: true,
                messageTs: response.data.ts,
                channel: response.data.channel,
                text: response.data.message?.text,
              };
              break;
            }

            case 'update': {
              const text = this.getNodeParameter('text', itemIndex) as string;
              const messageTimestamp = this.getNodeParameter('messageTimestamp', itemIndex) as string;

              const updatePayload = {
                channel,
                ts: messageTimestamp,
                text,
              };

              const response = await axios.post(
                'https://slack.com/api/chat.update',
                updatePayload,
                { headers }
              );

              if (!response.data.ok) {
                throw new Error(`Slack API error: ${response.data.error}`);
              }

              result = {
                resource: 'message',
                operation: 'update',
                success: true,
                messageTs: response.data.ts,
                channel: response.data.channel,
              };
              break;
            }

            case 'delete': {
              const messageTimestamp = this.getNodeParameter('messageTimestamp', itemIndex) as string;

              const deletePayload = {
                channel,
                ts: messageTimestamp,
              };

              const response = await axios.post(
                'https://slack.com/api/chat.delete',
                deletePayload,
                { headers }
              );

              if (!response.data.ok) {
                throw new Error(`Slack API error: ${response.data.error}`);
              }

              result = {
                resource: 'message',
                operation: 'delete',
                success: true,
                messageTs: messageTimestamp,
                channel,
              };
              break;
            }
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
              resource: this.getNodeParameter('resource', itemIndex),
              operation: this.getNodeParameter('operation', itemIndex),
            },
          });
        } else {
          throw new Error(`Slack operation failed: ${error.message}`);
        }
      }
    }

    return [returnData];
  }
}
