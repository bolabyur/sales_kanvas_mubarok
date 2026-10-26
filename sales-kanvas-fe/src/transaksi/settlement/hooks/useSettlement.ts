import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Settlement, SettlementPayload } from "../types/settlement.types";

const URL = "/transaksi/settlement";
const KEY = ["transaksi", "settlement"];

export function useSettlements() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Settlement[]>(URL) });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettlementPayload) =>
      api<Settlement>(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["plan"] }); 
    },
  });
}