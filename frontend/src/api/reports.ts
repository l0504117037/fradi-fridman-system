import { api } from "./client";
import { MonthlySummaryReport, YearlySummaryResponse } from "./types";

export const reportsApi = {
  monthlySummary: () => api.get<MonthlySummaryReport>("/reports/monthly-summary"),
  yearlySummary: () => api.get<YearlySummaryResponse>("/reports/yearly-summary"),
};
