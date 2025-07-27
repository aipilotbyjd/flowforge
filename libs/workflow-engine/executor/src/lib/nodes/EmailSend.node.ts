import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from '../interfaces/node.interface';
import * as nodemailer from 'nodemailer';

export class EmailSendNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Send Email',
    name: 'emailSend',
    icon: 'fa:envelope',
    group: ['output'],
    version: 1,
    description: 'Sends emails via SMTP',
    defaults: {
      name: 'Send Email',
      color: '#44CC11',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'smtp',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'From Email',
        name: 'fromEmail',
        type: 'string',
        default: '',
        placeholder: 'name@example.com',
        required: true,
        description: 'Email address the email should be sent from',
      },
      {
        displayName: 'To Email',
        name: 'toEmail',
        type: 'string',
        default: '',
        placeholder: 'recipient@example.com',
        required: true,
        description: 'Email address the email should be sent to',
      },
      {
        displayName: 'CC Email',
        name: 'ccEmail',
        type: 'string',
        default: '',
        placeholder: 'cc@example.com',
        description: 'Email addresses to CC (comma separated)',
      },
      {
        displayName: 'BCC Email',
        name: 'bccEmail',
        type: 'string',
        default: '',
        placeholder: 'bcc@example.com',
        description: 'Email addresses to BCC (comma separated)',
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        placeholder: 'Email subject',
        required: true,
        description: 'Subject line of the email',
      },
      {
        displayName: 'Message Type',
        name: 'messageType',
        type: 'options',
        options: [
          {
            name: 'HTML',
            value: 'html',
          },
          {
            name: 'Text',
            value: 'text',
          },
        ],
        default: 'html',
        description: 'Whether the message is HTML or plain text',
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: {
          rows: 5,
        },
        default: '',
        placeholder: 'Email message content',
        required: true,
        description: 'Content of the email',
      },
      {
        displayName: 'SMTP Configuration',
        name: 'smtpConfig',
        type: 'json',
        default: '{\n  "host": "smtp.gmail.com",\n  "port": 587,\n  "secure": false,\n  "auth": {\n    "user": "your-email@gmail.com",\n    "pass": "your-password"\n  }\n}',
        description: 'SMTP server configuration',
      },
      {
        displayName: 'Attachments',
        name: 'attachments',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'attachment',
            displayName: 'Attachment',
            values: [
              {
                displayName: 'File Name',
                name: 'filename',
                type: 'string',
                default: '',
                description: 'Name of the attachment file',
              },
              {
                displayName: 'Content',
                name: 'content',
                type: 'string',
                default: '',
                description: 'Content of the attachment (base64 encoded)',
              },
              {
                displayName: 'Content Type',
                name: 'contentType',
                type: 'string',
                default: 'text/plain',
                description: 'MIME type of the attachment',
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const fromEmail = this.getNodeParameter('fromEmail', itemIndex) as string;
        const toEmail = this.getNodeParameter('toEmail', itemIndex) as string;
        const ccEmail = this.getNodeParameter('ccEmail', itemIndex) as string;
        const bccEmail = this.getNodeParameter('bccEmail', itemIndex) as string;
        const subject = this.getNodeParameter('subject', itemIndex) as string;
        const messageType = this.getNodeParameter('messageType', itemIndex) as string;
        const message = this.getNodeParameter('message', itemIndex) as string;
        const smtpConfig = JSON.parse(this.getNodeParameter('smtpConfig', itemIndex) as string);
        const attachments = this.getNodeParameter('attachments.attachment', itemIndex, []) as Array<{
          filename: string;
          content: string;
          contentType: string;
        }>;

        // Create SMTP transporter
        const transporter = nodemailer.createTransporter(smtpConfig);

        // Prepare email options
        const mailOptions: any = {
          from: fromEmail,
          to: toEmail,
          subject: subject,
        };

        // Set message content based on type
        if (messageType === 'html') {
          mailOptions.html = message;
        } else {
          mailOptions.text = message;
        }

        // Add CC and BCC if provided
        if (ccEmail) {
          mailOptions.cc = ccEmail;
        }
        if (bccEmail) {
          mailOptions.bcc = bccEmail;
        }

        // Add attachments if provided
        if (attachments.length > 0) {
          mailOptions.attachments = attachments.map(attachment => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.content, 'base64'),
            contentType: attachment.contentType,
          }));
        }

        // Send email  
        const info = await transporter.sendMail(mailOptions);

        returnData.push({
          json: {
            messageId: info.messageId,
            from: fromEmail,
            to: toEmail,
            subject: subject,
            status: 'sent',
            timestamp: new Date().toISOString(),
            response: info.response,
          },
        });

        // Close transporter
        transporter.close();

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              status: 'failed',
              timestamp: new Date().toISOString(),
            },
          });
        } else {
          throw new Error(`Email send failed: ${error.message}`);
        }
      }
    }

    return [returnData];
  }
}
