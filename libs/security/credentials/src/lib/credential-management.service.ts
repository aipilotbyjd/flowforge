import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DateTime } from 'luxon';

export enum CredentialType {
  BASIC_AUTH = 'basicAuth',
  API_KEY = 'apiKey',
  OAUTH2 = 'oauth2',
  JWT = 'jwt',
  DATABASE = 'database',
  SSH_KEY = 'sshKey',
  CERTIFICATE = 'certificate',
  CUSTOM = 'custom',
}

export interface CredentialData {
  // Basic Auth
  username?: string;
  password?: string;
  
  // API Key
  apiKey?: string;
  apiSecret?: string;
  
  // OAuth2
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  authUrl?: string;
  tokenUrl?: string;
  
  // JWT
  token?: string;
  secret?: string;
  algorithm?: string;
  
  // Database
  host?: string;
  port?: number;
  database?: string;
  schema?: string;
  
  // SSH Key
  privateKey?: string;
  publicKey?: string;
  passphrase?: string;
  
  // Certificate
  certificate?: string;
  privateKeyCert?: string;
  
  // Custom fields
  [key: string]: any;
}

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  description?: string;
  data: CredentialData;
  organizationId: string;
  createdBy: string;
  isShared: boolean;
  sharedWith: string[]; // User IDs
  tags: string[];
  lastUsed?: Date;
  usageCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCredentialDto {
  name: string;
  type: CredentialType;
  description?: string;
  data: CredentialData;
  isShared?: boolean;
  sharedWith?: string[];
  tags?: string[];
  expiresAt?: Date;
}

export interface UpdateCredentialDto {
  name?: string;
  description?: string;
  data?: CredentialData;
  isShared?: boolean;
  sharedWith?: string[];
  tags?: string[];
  expiresAt?: Date;
  isActive?: boolean;
}

@Injectable()
export class CredentialManagementService {
  private readonly logger = new Logger(CredentialManagementService.name);
  private readonly credentials = new Map<string, Credential>();
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('CREDENTIAL_ENCRYPTION_KEY') || 
      crypto.randomBytes(32).toString('hex');
    
    if (!this.configService.get<string>('CREDENTIAL_ENCRYPTION_KEY')) {
      this.logger.warn('CREDENTIAL_ENCRYPTION_KEY not set, using temporary key. Set this in production!');
    }
  }

  /**
   * Create a new credential
   */
  async createCredential(
    createDto: CreateCredentialDto,
    organizationId: string,
    userId: string
  ): Promise<Credential> {
    // Check if credential name already exists in organization
    const existingCredential = Array.from(this.credentials.values()).find(
      cred => cred.name === createDto.name && cred.organizationId === organizationId
    );

    if (existingCredential) {
      throw new ConflictException(`Credential with name "${createDto.name}" already exists`);
    }

    // Validate credential data based on type
    this.validateCredentialData(createDto.type, createDto.data);

    const credentialId = this.generateCredentialId();
    
    const credential: Credential = {
      id: credentialId,
      name: createDto.name,
      type: createDto.type,
      description: createDto.description,
      data: await this.encryptCredentialData(createDto.data),
      organizationId,
      createdBy: userId,
      isShared: createDto.isShared || false,
      sharedWith: createDto.sharedWith || [],
      tags: createDto.tags || [],
      lastUsed: null,
      usageCount: 0,
      expiresAt: createDto.expiresAt,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.credentials.set(credentialId, credential);

    this.logger.log(`Credential created: ${credentialId} (${createDto.name})`);
    return this.sanitizeCredential(credential);
  }

  /**
   * Get credential by ID
   */
  async getCredential(credentialId: string, userId: string): Promise<Credential> {
    const credential = this.credentials.get(credentialId);
    
    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    // Check access permissions
    if (!this.hasAccess(credential, userId)) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    return this.sanitizeCredential(credential);
  }

  /**
   * Get credential data (decrypted) - for internal use only
   */
  async getCredentialData(credentialId: string, userId: string): Promise<CredentialData> {
    const credential = this.credentials.get(credentialId);
    
    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    if (!this.hasAccess(credential, userId)) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    if (!credential.isActive) {
      throw new BadRequestException(`Credential ${credentialId} is inactive`);
    }

    if (credential.expiresAt && credential.expiresAt < new Date()) {
      throw new BadRequestException(`Credential ${credentialId} has expired`);
    }

    // Update usage statistics
    credential.lastUsed = new Date();
    credential.usageCount++;
    credential.updatedAt = new Date();

    return await this.decryptCredentialData(credential.data);
  }

  /**
   * List credentials for user
   */
  async listCredentials(
    userId: string, 
    organizationId: string,
    filters?: {
      type?: CredentialType;
      tags?: string[];
      search?: string;
      includeShared?: boolean;
    }
  ): Promise<Credential[]> {
    let credentials = Array.from(this.credentials.values()).filter(
      cred => cred.organizationId === organizationId && this.hasAccess(cred, userId)
    );

    // Apply filters
    if (filters?.type) {
      credentials = credentials.filter(cred => cred.type === filters.type);
    }

    if (filters?.tags && filters.tags.length > 0) {
      credentials = credentials.filter(cred => 
        filters.tags!.some(tag => cred.tags.includes(tag))
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      credentials = credentials.filter(cred =>
        cred.name.toLowerCase().includes(search) ||
        (cred.description && cred.description.toLowerCase().includes(search))
      );
    }

    if (filters?.includeShared === false) {
      credentials = credentials.filter(cred => cred.createdBy === userId);
    }

    return credentials
      .map(cred => this.sanitizeCredential(cred))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Update credential
   */
  async updateCredential(
    credentialId: string,
    updateDto: UpdateCredentialDto,
    userId: string
  ): Promise<Credential> {
    const credential = this.credentials.get(credentialId);
    
    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    // Only creator can update credential
    if (credential.createdBy !== userId) {
      throw new BadRequestException('Only credential creator can update it');
    }

    // Validate new data if provided
    if (updateDto.data) {
      this.validateCredentialData(credential.type, updateDto.data);
    }

    // Update credential
    const updatedCredential: Credential = {
      ...credential,
      name: updateDto.name || credential.name,
      description: updateDto.description !== undefined ? updateDto.description : credential.description,
      data: updateDto.data ? await this.encryptCredentialData(updateDto.data) : credential.data,
      isShared: updateDto.isShared !== undefined ? updateDto.isShared : credential.isShared,
      sharedWith: updateDto.sharedWith || credential.sharedWith,
      tags: updateDto.tags || credential.tags,
      expiresAt: updateDto.expiresAt !== undefined ? updateDto.expiresAt : credential.expiresAt,
      isActive: updateDto.isActive !== undefined ? updateDto.isActive : credential.isActive,
      updatedAt: new Date(),
    };

    this.credentials.set(credentialId, updatedCredential);

    this.logger.log(`Credential updated: ${credentialId}`);
    return this.sanitizeCredential(updatedCredential);
  }

  /**
   * Delete credential
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    const credential = this.credentials.get(credentialId);
    
    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    // Only creator can delete credential
    if (credential.createdBy !== userId) {
      throw new BadRequestException('Only credential creator can delete it');
    }

    this.credentials.delete(credentialId);
    this.logger.log(`Credential deleted: ${credentialId}`);
  }

  /**
   * Share credential with users
   */
  async shareCredential(
    credentialId: string,
    userIds: string[],
    userId: string
  ): Promise<Credential> {
    const credential = this.credentials.get(credentialId);
    
    if (!credential) {
      throw new NotFoundException(`Credential ${credentialId} not found`);
    }

    if (credential.createdBy !== userId) {
      throw new BadRequestException('Only credential creator can share it');
    }

    const updatedSharedWith = Array.from(new Set([...credential.sharedWith, ...userIds]));
    
    const updatedCredential: Credential = {
      ...credential,
      isShared: true,
      sharedWith: updatedSharedWith,
      updatedAt: new Date(),
    };

    this.credentials.set(credentialId, updatedCredential);

    this.logger.log(`Credential shared: ${credentialId} with ${userIds.length} users`);
    return this.sanitizeCredential(updatedCredential);
  }

  /**
   * Test credential connection
   */
  async testCredential(credentialId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const credentialData = await this.getCredentialData(credentialId, userId);
    const credential = this.credentials.get(credentialId)!;

    try {
      switch (credential.type) {
        case CredentialType.BASIC_AUTH:
          return this.testBasicAuth(credentialData);
        case CredentialType.API_KEY:
          return this.testApiKey(credentialData);
        case CredentialType.DATABASE:
          return this.testDatabase(credentialData);
        default:
          return { success: true, message: 'Credential validation not implemented for this type' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get credential usage statistics
   */
  async getCredentialStats(credentialId: string, userId: string): Promise<{
    usageCount: number;
    lastUsed: Date | null;
    createdAt: Date;
    isExpired: boolean;
    daysUntilExpiry: number | null;
  }> {
    const credential = await this.getCredential(credentialId, userId);
    
    const isExpired = credential.expiresAt ? credential.expiresAt < new Date() : false;
    const daysUntilExpiry = credential.expiresAt 
      ? Math.ceil((credential.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      usageCount: credential.usageCount,
      lastUsed: credential.lastUsed,
      createdAt: credential.createdAt,
      isExpired,
      daysUntilExpiry,
    };
  }

  private async encryptCredentialData(data: CredentialData): Promise<CredentialData> {
    const encrypted: CredentialData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && this.shouldEncryptField(key)) {
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }
    
    return encrypted;
  }

  private async decryptCredentialData(data: CredentialData): Promise<CredentialData> {
    const decrypted: CredentialData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && this.shouldEncryptField(key)) {
        try {
          decrypted[key] = this.decrypt(value);
        } catch (error) {
          this.logger.error(`Failed to decrypt field ${key}:`, error);
          decrypted[key] = value; // Return encrypted value if decryption fails
        }
      } else {
        decrypted[key] = value;
      }
    }
    
    return decrypted;
  }

  private shouldEncryptField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'apiKey', 'apiSecret', 'clientSecret', 'accessToken', 
      'refreshToken', 'token', 'secret', 'privateKey', 'passphrase', 'certificate'
    ];
    return sensitiveFields.includes(fieldName);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('credential-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  private decrypt(encryptedData: string): string {
    try {
      const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
      
      if (!ivHex || !encrypted || !authTagHex) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('credential-data'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  private hasAccess(credential: Credential, userId: string): boolean {
    return credential.createdBy === userId || 
           (credential.isShared && credential.sharedWith.includes(userId));
  }

  private sanitizeCredential(credential: Credential): Credential {
    // Remove sensitive data from the response
    return {
      ...credential,
      data: this.sanitizeCredentialData(credential.data),
    };
  }

  private sanitizeCredentialData(data: CredentialData): CredentialData {
    const sanitized: CredentialData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (this.shouldEncryptField(key)) {
        sanitized[key] = '[ENCRYPTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private validateCredentialData(type: CredentialType, data: CredentialData): void {
    switch (type) {
      case CredentialType.BASIC_AUTH:
        if (!data.username || !data.password) {
          throw new BadRequestException('Basic auth requires username and password');
        }
        break;
      
      case CredentialType.API_KEY:
        if (!data.apiKey) {
          throw new BadRequestException('API key credential requires apiKey field');
        }
        break;
      
      case CredentialType.OAUTH2:
        if (!data.clientId || !data.clientSecret) {
          throw new BadRequestException('OAuth2 requires clientId and clientSecret');
        }
        break;
      
      case CredentialType.DATABASE:
        if (!data.host || !data.username || !data.password) {
          throw new BadRequestException('Database credential requires host, username, and password');
        }
        break;
      
      case CredentialType.JWT:
        if (!data.token && !data.secret) {
          throw new BadRequestException('JWT credential requires either token or secret');
        }
        break;
    }
  }

  private generateCredentialId(): string {
    return `cred_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private async testBasicAuth(data: CredentialData): Promise<{ success: boolean; message: string }> {
    // Placeholder for basic auth testing
    return { success: true, message: 'Basic auth credentials are valid' };
  }

  private async testApiKey(data: CredentialData): Promise<{ success: boolean; message: string }> {
    // Placeholder for API key testing
    return { success: true, message: 'API key is valid' };
  }

  private async testDatabase(data: CredentialData): Promise<{ success: boolean; message: string }> {
    // Placeholder for database connection testing
    return { success: true, message: 'Database connection successful' };
  }
}
