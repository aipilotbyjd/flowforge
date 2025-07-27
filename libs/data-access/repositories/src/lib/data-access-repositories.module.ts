import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, UserSession } from '@flowforge/core/entities';
import { UserRepository } from './user.repository';
import { OrganizationRepository } from './organization.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, UserSession])],
  providers: [UserRepository, OrganizationRepository],
  exports: [UserRepository, OrganizationRepository],
})
export class DataAccessRepositoriesModule {}
