import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Plan, PlanPayload, PlanStatus, PlanListResponse } from "../types/plan.types";

const URL = "/plan";
const KEY = ["plan"];

// PERBAIKAN: Menerima parameter pagination & search
export function usePlans(page: number = 1, limit: number = 10, search: string = "") {
  return useQuery({ 
    queryKey: [...KEY, page, limit, search], 
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append("search", search);
      
      return api<PlanListResponse>(`${URL}?${params.toString()}`);
    },
    placeholderData: keepPreviousData, // Mencegah tabel berkedip/blank saat ganti halaman
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api<Plan>(`${URL}/${id}`),
    enabled: !!id, 
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlanPayload) =>
      api<Plan>(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PlanStatus }) =>
      api<Plan>(`${URL}/${id}/update-status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}