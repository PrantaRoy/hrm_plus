import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ClientDto, CreateClientInput, PaginatedResult, UpdateClientInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { clientInclude, toClientDto } from "./client.mapper";

export interface ListClientsOptions {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}

function blankToNull(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

export async function listClients(
  prisma: PrismaClient,
  options: ListClientsOptions
): Promise<PaginatedResult<ClientDto>> {
  const where: Prisma.ClientWhereInput = {
    ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search } },
            { email: { contains: options.search } },
            { companyName: { contains: options.search } },
            { tag: { contains: options.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: clientInclude,
      orderBy: { name: "asc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.client.count({ where }),
  ]);

  return { items: items.map(toClientDto), total, page: options.page, pageSize: options.pageSize };
}

async function loadClientOrThrow(prisma: PrismaClient, id: number) {
  const client = await prisma.client.findUnique({ where: { id }, include: clientInclude });
  if (!client) throw ApiError.notFound("Client not found");
  return client;
}

export async function getClient(prisma: PrismaClient, id: number): Promise<ClientDto> {
  return toClientDto(await loadClientOrThrow(prisma, id));
}

export async function createClient(prisma: PrismaClient, input: CreateClientInput): Promise<ClientDto> {
  const created = await prisma.client.create({
    data: {
      name: input.name,
      email: input.email,
      companyName: blankToNull(input.companyName),
      phoneNumber: blankToNull(input.phoneNumber),
      address: input.address,
      tag: input.tag,
      priority: input.priority,
      isActive: input.isActive ?? true,
    },
    include: clientInclude,
  });
  return toClientDto(created);
}

export async function updateClient(prisma: PrismaClient, id: number, input: UpdateClientInput): Promise<ClientDto> {
  await loadClientOrThrow(prisma, id);
  const updated = await prisma.client.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.companyName !== undefined ? { companyName: blankToNull(input.companyName) } : {}),
      ...(input.phoneNumber !== undefined ? { phoneNumber: blankToNull(input.phoneNumber) } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.tag !== undefined ? { tag: input.tag } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: clientInclude,
  });
  return toClientDto(updated);
}

/** Clients with projects are deactivated rather than deleted so project history keeps its client. */
export async function deleteClient(prisma: PrismaClient, id: number): Promise<void> {
  const client = await loadClientOrThrow(prisma, id);
  if (client._count.projects > 0) {
    throw ApiError.conflict(
      "This client has projects and cannot be deleted. Deactivate the client instead.",
      "CLIENT_HAS_PROJECTS"
    );
  }
  await prisma.client.delete({ where: { id } });
}
