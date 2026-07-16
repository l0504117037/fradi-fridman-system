import { api } from "./client";
import { ServiceItem } from "./types";

export const servicesApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return api.get<ServiceItem[]>(`/services${qs}`);
  },
  get: (id: string) => api.get<ServiceItem>(`/services/${id}`),
  create: (data: Omit<ServiceItem, "_id">) => api.post<ServiceItem>("/services", data),
  update: (id: string, data: Partial<Omit<ServiceItem, "_id">>) =>
    api.put<ServiceItem>(`/services/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/services/${id}`),
};
