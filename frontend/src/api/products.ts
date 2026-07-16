import { api } from "./client";
import { Product } from "./types";

export const productsApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return api.get<Product[]>(`/products${qs}`);
  },
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<Product, "_id">) => api.post<Product>("/products", data),
  update: (id: string, data: Partial<Omit<Product, "_id">>) => api.put<Product>(`/products/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/products/${id}`),
};
