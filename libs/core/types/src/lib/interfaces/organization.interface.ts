export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  plan: OrganizationPlan;
  settings: OrganizationSettings;
  quotas: OrganizationQuotas;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  allowUserRegistration: boolean;
  defaultUserRole: string;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  twoFactorRequired: boolean;
  ipWhitelist?: string[];
  webhookUrl?: string;
}

export interface OrganizationQuotas {
  maxUsers: number;
  maxWorkflows: number;
  maxExecutionsPerMonth: number;
  maxExecutionTime: number;
  storageLimit: number;
}

export enum OrganizationPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  plan: OrganizationPlan;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  settings?: Partial<OrganizationSettings>;
}
