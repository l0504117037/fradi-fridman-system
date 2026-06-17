import { api } from "./client";
import { Appointment, CreateAppointmentInput, Customer, UpdateAppointmentInput } from "./types";

export const appointmentsApi = {
  listRange: (start: string, end: string) =>
    api.get<Appointment[]>(`/appointments?start=${start}&end=${end}`),
  create: (data: CreateAppointmentInput) =>
    api.post<{ appointment: Appointment; customer: Customer }>("/appointments", data),
  update: (id: string, data: UpdateAppointmentInput) =>
    api.put<{ appointment: Appointment; customer: Customer }>(`/appointments/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/appointments/${id}`),
};
