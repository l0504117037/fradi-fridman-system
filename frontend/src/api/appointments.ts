import { api } from "./client";
import { Appointment, AppointmentStatus, CreateAppointmentInput, Customer } from "./types";

export const appointmentsApi = {
  listRange: (start: string, end: string) =>
    api.get<Appointment[]>(`/appointments?start=${start}&end=${end}`),
  create: (data: CreateAppointmentInput) =>
    api.post<{ appointment: Appointment; customer: Customer }>("/appointments", data),
  update: (id: string, data: Partial<{ date: string; time: string; status: AppointmentStatus; note: string }>) =>
    api.put<Appointment>(`/appointments/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/appointments/${id}`),
};
