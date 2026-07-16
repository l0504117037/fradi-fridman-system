import { api } from "./client";
import { Customer, CustomerHistory } from "./types";

export const customersApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return api.get<Customer[]>(`/customers${qs}`);
  },
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: Omit<Customer, "_id">) => api.post<Customer>("/customers", data),
  update: (id: string, data: Partial<Omit<Customer, "_id">>) =>
    api.put<Customer>(`/customers/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/customers/${id}`),

  history: (id: string) => api.get<CustomerHistory>(`/customers/${id}/history`),

  addPurchase: (
    customerId: string,
    data: {
      itemType: "Product" | "Wig";
      itemId: string;
      totalPrice?: number;
      date?: string;
      payment?: { amount: number; date?: string };
    }
  ) => api.post(`/customers/${customerId}/purchase`, data),

  addPurchasePayment: (customerId: string, purchaseId: string, data: { amount: number; date?: string }) =>
    api.post(`/customers/${customerId}/purchases/${purchaseId}/payments`, data),

  deletePurchase: (customerId: string, purchaseId: string) =>
    api.delete<{ message: string }>(`/customers/${customerId}/purchases/${purchaseId}`),

  addService: (
    customerId: string,
    data: {
      serviceId: string;
      price?: number;
      date?: string;
      note?: string;
      payment?: { amount: number; date?: string };
    }
  ) => api.post(`/customers/${customerId}/services`, data),

  addServicePayment: (customerId: string, serviceRecordId: string, data: { amount: number; date?: string }) =>
    api.post(`/customers/${customerId}/services/${serviceRecordId}/payments`, data),

  deleteServiceRecord: (customerId: string, serviceRecordId: string) =>
    api.delete<{ message: string }>(`/customers/${customerId}/services/${serviceRecordId}`),
};
