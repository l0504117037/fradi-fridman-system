import { api } from "./client";
import { Employee, EmployeeMonthly } from "./types";

export const employeesApi = {
  list: (params?: { search?: string }) => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return api.get<Employee[]>(`/employees${qs}`);
  },
  get: (id: string) => api.get<Employee>(`/employees/${id}`),
  create: (data: Omit<Employee, "_id">) => api.post<Employee>("/employees", data),
  update: (id: string, data: Partial<Omit<Employee, "_id">>) =>
    api.put<Employee>(`/employees/${id}`, data),
  remove: (id: string) => api.delete(`/employees/${id}`),

  getMonthly: (id: string) =>
    api.get<{ employee: Employee; months: EmployeeMonthly[] }>(`/employees-monthly/employee/${id}`),
  createMonthly: (data: {
    employee: string;
    date: string;
    hoursWorked: number;
    salaryPaid: number;
  }) => api.post<EmployeeMonthly>("/employees-monthly", data),
  updateMonthly: (data: {
    employeeId: string;
    date: string;
    hoursWorked: number;
    salaryPaid: number;
  }) => api.put<EmployeeMonthly>("/employees-monthly/update-by-employee", data),
  deleteMonthly: (id: string) => api.delete(`/employees-monthly/${id}`),
};
