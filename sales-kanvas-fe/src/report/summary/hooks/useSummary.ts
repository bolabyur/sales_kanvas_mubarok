import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SummarySale, SummaryZona, SummaryRekonsiliasi } from "../types/summary.types";

export function useSummarySale(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["summary", "sale", startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return api<SummarySale>(`/summary/sale?${params.toString()}`);
    },
  });
}

export function useSummarySaleZona(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["summary", "sale-zona", startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return api<SummaryZona[]>(`/summary/sale-zona?${params.toString()}`);
    },
  });
}

export function useSummaryRekonsiliasi(status?: string) {
  return useQuery({
    queryKey: ["summary", "rekonsiliasi", status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      return api<SummaryRekonsiliasi>(`/summary/rekonsiliasi?${params.toString()}`);
    },
  });
}