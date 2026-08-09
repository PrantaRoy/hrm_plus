import { CompanyServiceDto, PublicCompanyServiceDto } from "@hrm-plus/shared";

type CompanyServiceRecord = {
  id: number;
  icon: string;
  title: string;
  summary: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toCompanyServiceDto(service: CompanyServiceRecord): CompanyServiceDto {
  return {
    id: service.id,
    icon: service.icon,
    title: service.title,
    summary: service.summary,
    description: service.description,
    sortOrder: service.sortOrder,
    isActive: service.isActive,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

export function toPublicCompanyServiceDto(service: CompanyServiceRecord): PublicCompanyServiceDto {
  return {
    id: service.id,
    icon: service.icon,
    title: service.title,
    summary: service.summary,
    description: service.description,
    sortOrder: service.sortOrder,
  };
}
