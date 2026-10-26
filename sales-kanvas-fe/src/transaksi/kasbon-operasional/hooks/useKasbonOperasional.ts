import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { KasbonOperasional } from "../types/kasbon-operasional.types";

const URL = "/transaksi/kasbon-operasional";
const KEY = ["transaksi", "kasbon-operasional"];

export function useKasbonOperasionals() {
  return useQuery({ queryKey: KEY, queryFn: () => api<KasbonOperasional[]>(URL) });
}

export function useUpdateStatusKasbonOp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`${URL}/${id}/update-status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}