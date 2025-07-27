export enum NodeType {
  // Core nodes
  START = 'start',
  END = 'end',
  
  // Logic nodes
  IF = 'if',
  SWITCH = 'switch',
  MERGE = 'merge',
  SPLIT = 'split',
  
  // Data nodes
  SET = 'set',
  TRANSFORM = 'transform',
  FILTER = 'filter',
  SORT = 'sort',
  
  // HTTP nodes
  HTTP_REQUEST = 'http_request',
  WEBHOOK = 'webhook',
  
  // Database nodes
  DATABASE_QUERY = 'database_query',
  DATABASE_INSERT = 'database_insert',
  DATABASE_UPDATE = 'database_update',
  DATABASE_DELETE = 'database_delete',
  
  // Email nodes
  EMAIL_SEND = 'email_send',
  EMAIL_TEMPLATE = 'email_template',
  
  // File nodes
  FILE_READ = 'file_read',
  FILE_WRITE = 'file_write',
  
  // Utility nodes
  DELAY = 'delay',
  SCHEDULE = 'schedule',
  LOOP = 'loop',
  FUNCTION = 'function',
  
  // Third-party integrations
  SLACK = 'slack',
  DISCORD = 'discord',
  TEAMS = 'teams',
  TELEGRAM = 'telegram',
  
  // Cloud services
  AWS_S3 = 'aws_s3',
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
  
  // Custom
  CUSTOM = 'custom'
}
