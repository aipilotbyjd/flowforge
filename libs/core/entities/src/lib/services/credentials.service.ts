import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential, CredentialType } from '@flowforge/core/entities';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
  ) {}

  async createCredential(data: Partial<Credential>): Promise<Credential> {
    try {
      const credential = this.credentialRepository.create(data);
      return await this.credentialRepository.save(credential);
    } catch (error) {
      throw new InternalServerErrorException('Error creating credential');
    }
  }

  async getCredentialById(id: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({ where: { id } });
    if (!credential) {
      throw new NotFoundException('Credential not found');
    }
    return credential;
  }

  async updateCredential(id: string, data: Partial<Credential>): Promise<Credential> {
    const credential = await this.getCredentialById(id);
    Object.assign(credential, data);
    return this.credentialRepository.save(credential);
  }

  async deleteCredential(id: string): Promise<void> {
    const credential = await this.getCredentialById(id);
    await this.credentialRepository.remove(credential);
  }

  async listCredentialsByOrganization(organizationId: string): Promise<Credential[]> {
    return this.credentialRepository.find({ where: { organizationId } });
  }

  async toggleCredentialActive(id: string, isActive: boolean): Promise<Credential> {
    const credential = await this.getCredentialById(id);
    credential.isActive = isActive;
    return this.credentialRepository.save(credential);
  }
}
