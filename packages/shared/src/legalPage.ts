export interface LegalPageDto {
  id: number;
  slug: string;
  title: string;
  content: string;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLegalPageInput {
  slug: string;
  title: string;
  content: string;
}

export interface UpdateLegalPageInput {
  title?: string;
  content?: string;
}

export type PublicLegalPageDto = Omit<LegalPageDto, "updatedById" | "createdAt" | "updatedAt">;
