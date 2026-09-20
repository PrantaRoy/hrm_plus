import {
  ClientDto,
  ClientPaginatedResult,
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listClients(query: ListClientsQuery = {}): Promise<ClientPaginatedResult> {
  const res = await apiClient.get<ClientPaginatedResult>("/clients", { params: query });
  return res.data;
}

export async function createClient(input: CreateClientInput): Promise<ClientDto> {
  const res = await apiClient.post<ClientDto>("/clients", input);
  return res.data;
}

export async function updateClient(id: number, input: UpdateClientInput): Promise<ClientDto> {
  const res = await apiClient.patch<ClientDto>(`/clients/${id}`, input);
  return res.data;
}

export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
