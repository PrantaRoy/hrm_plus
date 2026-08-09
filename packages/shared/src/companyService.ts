export interface CompanyServiceDto {
  id: number;
  icon: string;
  title: string;
  summary: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyServiceInput {
  icon: string;
  title: string;
  summary: string;
  description: string;
  isActive?: boolean;
}

export type UpdateCompanyServiceInput = Partial<CreateCompanyServiceInput>;

export type PublicCompanyServiceDto = Omit<CompanyServiceDto, "isActive" | "createdAt" | "updatedAt">;

export interface ReorderCompanyServicesInput {
  orderedIds: number[];
}
