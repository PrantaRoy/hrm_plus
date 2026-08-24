import { SupportTicketCategory } from "../../../generated/control";
import { TicketCategoryDto } from "@hrm-plus/shared";

export function toTicketCategoryDto(category: SupportTicketCategory): TicketCategoryDto {
  return {
    id: category.id,
    name: category.name,
    isDefault: category.isDefault,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
  };
}
