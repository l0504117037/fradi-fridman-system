import { api } from "./client";
import { Hairdresser, HairdresserDetail, HairdresserSale } from "./types";

export const hairdressersApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return api.get<Hairdresser[]>(`/hairdressers${qs}`);
  },
  get: (id: string) => api.get<Hairdresser>(`/hairdressers/${id}`),
  detail: (id: string) => api.get<HairdresserDetail>(`/hairdressers/${id}/detail`),
  create: (data: Omit<Hairdresser, "_id">) => api.post<Hairdresser>("/hairdressers", data),
  update: (id: string, data: Partial<Omit<Hairdresser, "_id">>) =>
    api.put<Hairdresser>(`/hairdressers/${id}`, data),
  remove: (id: string) => api.delete(`/hairdressers/${id}`),

  addSale: (
    id: string,
    data: { wigId: string; totalPrice: number; date?: string; payment?: { amount: number; date?: string }; note?: string }
  ) => api.post<HairdresserSale>(`/hairdressers/${id}/sales`, data),

  addPayment: (id: string, saleId: string, data: { amount: number; date?: string }) =>
    api.post(`/hairdressers/${id}/sales/${saleId}/payments`, data),

  deleteSale: (id: string, saleId: string) =>
    api.delete(`/hairdressers/${id}/sales/${saleId}`),
};
