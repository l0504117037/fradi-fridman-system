import { api } from "./client";
import { Product } from "./types";

export const productsApi = {
  list: () => api.get<Product[]>("/products"),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<Product, "_id">) => api.post<Product>("/products", data),
  update: (id: string, data: Partial<Omit<Product, "_id">>) => api.put<Product>(`/products/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/products/${id}`),
};
