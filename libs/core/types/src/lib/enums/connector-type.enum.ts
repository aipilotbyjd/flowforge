export enum ConnectorType {
  // Communication
  EMAIL = 'email',
  SLACK = 'slack',
  DISCORD = 'discord',
  TEAMS = 'teams',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
  
  // Databases
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  REDIS = 'redis',
  ELASTICSEARCH = 'elasticsearch',
  
  // Cloud Services
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp',
  DIGITALOCEAN = 'digitalocean',
  
  // File Storage
  S3 = 's3',
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
  ONEDRIVE = 'onedrive',
  
  // Development Tools
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
  JIRA = 'jira',
  CONFLUENCE = 'confluence',
  
  // CRM & Marketing
  SALESFORCE = 'salesforce',
  HUBSPOT = 'hubspot',
  MAILCHIMP = 'mailchimp',
  SENDGRID = 'sendgrid',
  
  // Analytics
  GOOGLE_ANALYTICS = 'google_analytics',
  MIXPANEL = 'mixpanel',
  AMPLITUDE = 'amplitude',
  
  // Custom
  HTTP = 'http',
  WEBHOOK = 'webhook',
  FTP = 'ftp',
  SFTP = 'sftp',
  SSH = 'ssh',
  
  // Internal
  CUSTOM = 'custom'
}

export enum ConnectorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}
