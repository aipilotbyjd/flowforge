import { ConnectorType, ConnectorStatus } from '../enums/connector-type.enum';

export interface ConnectorEntity {
  id: string;
  name: string;
  type: ConnectorType;
  status: ConnectorStatus;
  configuration: ConnectorConfiguration;
  credentials: Record<string, any>;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface ConnectorConfiguration {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  rateLimiting?: RateLimitConfig;
  authentication?: AuthenticationConfig;
  customHeaders?: Record<string, string>;
  validateSsl?: boolean;
}

export interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
}

export interface AuthenticationConfig {
  type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  apiKeyHeader?: string;
  bearerTokenPrefix?: string;
  oauth2Config?: OAuth2Config;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope?: string;
  redirectUrl?: string;
}

export interface CreateConnectorRequest {
  name: string;
  type: ConnectorType;
  configuration: ConnectorConfiguration;
  credentials: Record<string, any>;
}

export interface UpdateConnectorRequest {
  name?: string;
  configuration?: Partial<ConnectorConfiguration>;
  credentials?: Record<string, any>;
  status?: ConnectorStatus;
}

export interface ConnectorTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}
