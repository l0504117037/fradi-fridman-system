import { api } from "./client";
import { Wig } from "./types";

export const wigsApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return api.get<Wig[]>(`/wigs${qs}`);
  },
  get: (id: string) => api.get<Wig>(`/wigs/${id}`),
  create: (data: Omit<Wig, "_id" | "supplier"> & { supplier?: string }) => api.post<Wig>("/wigs", data),
  update: (id: string, data: Partial<Omit<Wig, "_id" | "supplier">> & { supplier?: string }) =>
    api.put<Wig>(`/wigs/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/wigs/${id}`),
};
