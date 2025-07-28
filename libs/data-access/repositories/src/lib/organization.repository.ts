import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '@flowforge/core-entities';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) { }

  async create(createOrgData: {
    name: string;
    slug: string;
    settings?: Record<string, any>;
  }): Promise<Organization> {
    const organization = this.organizationRepository.create(createOrgData);
    return this.organizationRepository.save(organization);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { id },
      relations: ['users', 'workflows'],
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { slug },
    });
  }

  async update(
    id: string,
    updateData: Partial<Pick<Organization, 'name' | 'settings'>>,
  ): Promise<void> {
    await this.organizationRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.organizationRepository.delete(id);
  }

  async generateUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await this.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
