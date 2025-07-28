import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Credential, CredentialType } from '@flowforge/core-entities';

interface CreateCredentialDto {
  name: string;
  description?: string;
  type: CredentialType;
  data: Record<string, any>;
  organizationId: string;
  createdById: string;
  expiresAt?: Date;
}

interface UpdateCredentialDto {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  expiresAt?: Date;
  isActive?: boolean;
}

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get('ENCRYPTION_KEY');
    if (!this.encryptionKey || this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
  }

  async createCredential(dto: CreateCredentialDto): Promise<Credential> {
    this.logger.log(`Creating credential: ${dto.name} for organization ${dto.organizationId}`);

    // Check if credential with same name exists in organization
    const existingCredential = await this.credentialRepository.findOne({
      where: {
        name: dto.name,
        organizationId: dto.organizationId,
      },
    });

    if (existingCredential) {
      throw new BadRequestException(`Credential with name '${dto.name}' already exists`);
    }

    // Encrypt the credential data
    const { encryptedData, encryptionKeyId } = this.encryptCredentialData(dto.data);

    const credential = this.credentialRepository.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      encryptedData,
      encryptionKeyId,
      organizationId: dto.organizationId,
      createdById: dto.createdById,
      expiresAt: dto.expiresAt,
      isActive: true,
    });

    const savedCredential = await this.credentialRepository.save(credential);
    this.logger.log(`Credential created successfully: ${savedCredential.id}`);

    return savedCredential;
  }

  async getCredential(id: string, organizationId: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
      where: { id, organizationId },
      relations: ['organization', 'createdBy'],
    });

    if (!credential) {
      throw new NotFoundException(`Credential with ID ${id} not found`);
    }

    return credential;
  }

  async getCredentialWithData(id: string, organizationId: string): Promise<Credential & { data: any }> {
    const credential = await this.getCredential(id, organizationId);
    
    // Decrypt the credential data
    const decryptedData = this.decryptCredentialData(
      credential.encryptedData,
      credential.encryptionKeyId
    );

    return {
      ...credential,
      data: decryptedData,
    };
  }

  async listCredentials(organizationId: string, type?: CredentialType): Promise<Credential[]> {
    const whereCondition: any = { organizationId };
    
    if (type) {
      whereCondition.type = type;
    }

    return await this.credentialRepository.find({
      where: whereCondition,
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateCredential(
    id: string,
    organizationId: string,
    dto: UpdateCredentialDto,
  ): Promise<Credential> {
    const credential = await this.getCredential(id, organizationId);

    // Update basic fields
    if (dto.name) credential.name = dto.name;
    if (dto.description !== undefined) credential.description = dto.description;
    if (dto.expiresAt !== undefined) credential.expiresAt = dto.expiresAt;
    if (dto.isActive !== undefined) credential.isActive = dto.isActive;

    // If data is being updated, re-encrypt it
    if (dto.data) {
      const { encryptedData, encryptionKeyId } = this.encryptCredentialData(dto.data);
      credential.encryptedData = encryptedData;
      credential.encryptionKeyId = encryptionKeyId;
    }

    const updatedCredential = await this.credentialRepository.save(credential);
    this.logger.log(`Credential updated: ${id}`);

    return updatedCredential;
  }

  async deleteCredential(id: string, organizationId: string): Promise<void> {
    const credential = await this.getCredential(id, organizationId);
    
    await this.credentialRepository.remove(credential);
    this.logger.log(`Credential deleted: ${id}`);
  }

  async testCredential(id: string, organizationId: string): Promise<{ valid: boolean; message: string }> {
    try {
      const credential = await this.getCredentialWithData(id, organizationId);
      
      // Basic validation
      if (!credential.isValid) {
        return {
          valid: false,
          message: credential.isExpired ? 'Credential has expired' : 'Credential is inactive',
        };
      }

      // Type-specific validation
      const isValid = await this.validateCredentialByType(credential.type, credential.data);
      
      return {
        valid: isValid,
        message: isValid ? 'Credential is valid' : 'Credential validation failed',
      };
    } catch (error) {
      this.logger.error(`Error testing credential ${id}:`, error);
      return {
        valid: false,
        message: `Test failed: ${error.message}`,
      };
    }
  }

  async getCredentialsByType(organizationId: string, type: CredentialType): Promise<Credential[]> {
    return await this.credentialRepository.find({
      where: {
        organizationId,
        type,
        isActive: true,
      },
      order: { name: 'ASC' },
    });
  }

  async getCredentialForNode(
    credentialName: string,
    organizationId: string,
    nodeType: string,
  ): Promise<any> {
    const credential = await this.credentialRepository.findOne({
      where: {
        name: credentialName,
        organizationId,
        isActive: true,
      },
    });

    if (!credential) {
      throw new NotFoundException(`Credential '${credentialName}' not found`);
    }

    if (!credential.isValid) {
      throw new BadRequestException(`Credential '${credentialName}' is invalid or expired`);
    }

    return this.decryptCredentialData(credential.encryptedData, credential.encryptionKeyId);
  }

  private encryptCredentialData(data: Record<string, any>): { encryptedData: string; encryptionKeyId: string } {
    try {
      const dataString = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      
      cipher.setAAD(Buffer.from('FlowForge', 'utf8'));
      
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      const encryptedData = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
      const encryptionKeyId = crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 16);
      
      return { encryptedData, encryptionKeyId };
    } catch (error) {
      this.logger.error('Error encrypting credential data:', error);
      throw new Error('Failed to encrypt credential data');
    }
  }

  private decryptCredentialData(encryptedData: string, encryptionKeyId: string): Record<string, any> {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('FlowForge', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Error decrypting credential data:', error);
      throw new Error('Failed to decrypt credential data');
    }
  }

  private async validateCredentialByType(type: CredentialType, data: any): Promise<boolean> {
    switch (type) {
      case CredentialType.API_KEY:
        return !!(data.apiKey || data.token);
      
      case CredentialType.BASIC_AUTH:
        return !!(data.username && data.password);
      
      case CredentialType.OAUTH2:
        return !!(data.clientId && data.clientSecret);
      
      case CredentialType.DATABASE:
        return !!(data.host && data.database && data.username);
      
      case CredentialType.EMAIL:
        return !!(data.host && data.port && data.username && data.password);
      
      case CredentialType.SSH_KEY:
        return !!(data.privateKey || data.keyPath);
      
      default:
        return true; // For custom types, assume valid
    }
  }

  async getCredentialStats(organizationId: string): Promise<any> {
    const credentials = await this.listCredentials(organizationId);
    
    const stats = {
      total: credentials.length,
      active: credentials.filter(c => c.isActive).length,
      expired: credentials.filter(c => c.isExpired).length,
      byType: {} as Record<string, number>,
    };

    // Count by type
    credentials.forEach(credential => {
      stats.byType[credential.type] = (stats.byType[credential.type] || 0) + 1;
    });

    return stats;
  }
}
