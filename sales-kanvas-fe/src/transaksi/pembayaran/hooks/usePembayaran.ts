import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Pembayaran, PembayaranPayload } from "../types/pembayaran.types";

const URL = "/transaksi/pembayaran";
const KEY = ["transaksi", "pembayaran"];

export function usePembayarans() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Pembayaran[]>(URL) });
}

export function useCreatePembayaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PembayaranPayload) =>
      api<Pembayaran>(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["transaksi", "invoice"] }); 
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}