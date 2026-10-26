import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Retur, ReturPayload } from "../types/retur.types";

const URL = "/transaksi/retur";
const KEY = ["transaksi", "retur"];

export function useReturs() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Retur[]>(URL) });
}

export function useCreateRetur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReturPayload) =>
      api<Retur>(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["master", "batch"] }); 
      qc.invalidateQueries({ queryKey: ["transaksi", "invoice"] });
    },
  });
}