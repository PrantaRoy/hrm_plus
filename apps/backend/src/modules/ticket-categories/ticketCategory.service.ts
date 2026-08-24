import { CreateTicketCategoryInput, TicketCategoryDto, UpdateTicketCategoryInput } from "@hrm-plus/shared";
import { controlClient } from "../../db/controlClient";
import { ApiError } from "../../utils/ApiError";
import { toTicketCategoryDto } from "./ticketCategory.mapper";

// Kept in sync with the seed INSERT embedded in migration
// `20260823130013_add_support_tickets/migration.sql` — this upsert exists only for
// new-environment/test parity where the migration hasn't been applied yet.
const DEFAULT_TICKET_CATEGORIES = ["Billing", "Technical", "Downtime", "Renewal", "Bugs", "Other"];

export async function seedDefaultTicketCategories(): Promise<void> {
  await Promise.all(
    DEFAULT_TICKET_CATEGORIES.map((name) =>
      controlClient.supportTicketCategory.upsert({
        where: { name },
        update: {},
        create: { name, isDefault: true },
      })
    )
  );
}

export async function listActiveTicketCategories(): Promise<TicketCategoryDto[]> {
  const categories = await controlClient.supportTicketCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return categories.map(toTicketCategoryDto);
}

export async function listAllTicketCategories(): Promise<TicketCategoryDto[]> {
  const categories = await controlClient.supportTicketCategory.findMany({
    orderBy: { name: "asc" },
  });
  return categories.map(toTicketCategoryDto);
}

export async function createTicketCategory(input: CreateTicketCategoryInput): Promise<TicketCategoryDto> {
  const existing = await controlClient.supportTicketCategory.findUnique({ where: { name: input.name } });
  if (existing) {
    throw ApiError.conflict("A category with this name already exists");
  }
  const created = await controlClient.supportTicketCategory.create({ data: { name: input.name } });
  return toTicketCategoryDto(created);
}

export async function updateTicketCategory(id: number, input: UpdateTicketCategoryInput): Promise<TicketCategoryDto> {
  const existing = await controlClient.supportTicketCategory.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Ticket category not found");
  }
  if (input.name && input.name !== existing.name) {
    const nameTaken = await controlClient.supportTicketCategory.findUnique({ where: { name: input.name } });
    if (nameTaken) {
      throw ApiError.conflict("A category with this name already exists");
    }
  }
  const updated = await controlClient.supportTicketCategory.update({
    where: { id },
    data: { name: input.name, isActive: input.isActive },
  });
  return toTicketCategoryDto(updated);
}

export async function deleteTicketCategory(id: number): Promise<void> {
  const existing = await controlClient.supportTicketCategory.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Ticket category not found");
  }
  const ticketCount = await controlClient.supportTicket.count({ where: { categoryId: id } });
  if (ticketCount > 0) {
    throw ApiError.conflict("This category is in use by existing tickets; deactivate it instead of deleting");
  }
  await controlClient.supportTicketCategory.delete({ where: { id } });
}
