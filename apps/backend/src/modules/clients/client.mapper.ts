import { Prisma } from "../../../generated/tenant";
import { ClientDto, ClientPriority } from "@hrm-plus/shared";

const clientWithCounts = Prisma.validator<Prisma.ClientDefaultArgs>()({
  include: { _count: { select: { projects: true } } },
});

export type ClientWithCounts = Prisma.ClientGetPayload<typeof clientWithCounts>;
export const clientInclude = clientWithCounts.include;

export function toClientDto(client: ClientWithCounts): ClientDto {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    companyName: client.companyName,
    phoneNumber: client.phoneNumber,
    address: client.address,
    tag: client.tag,
    priority: client.priority as ClientPriority,
    isActive: client.isActive,
    projectCount: client._count.projects,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
