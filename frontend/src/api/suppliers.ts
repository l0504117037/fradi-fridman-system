import { api } from "./client";
import { Supplier, SupplierTransaction } from "./types";

export const suppliersApi = {
  list: () => api.get<Supplier[]>("/suppliers"),
  get: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: { name: string; phone?: string; email?: string; address?: string; notes?: string }) =>
    api.post<Supplier>("/suppliers", data),
  update: (id: string, data: Partial<Omit<Supplier, "_id" | "transactions">>) =>
    api.put<Supplier>(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/suppliers/${id}`),

  addTransaction: (id: string, data: Omit<SupplierTransaction, "_id">) =>
    api.post<{ transactions: SupplierTransaction[]; summary: Supplier["summary"] }>(
      `/suppliers/${id}/transactions`,
      data
    ),
};
