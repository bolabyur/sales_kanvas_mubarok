import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProdukOut, ProdukOutPayload } from "../types/produk-out.types";

const URL = "/transaksi/produk-out";
const KEY = ["transaksi", "produk-out"];

export function useProdukOuts() {
  return useQuery({ queryKey: KEY, queryFn: () => api<ProdukOut[]>(URL) });
}

export function useCreateProdukOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProdukOutPayload) =>
      api<ProdukOut>(URL, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Invalidasi query BON karena statusnya berubah jadi Loaded
      qc.invalidateQueries({ queryKey: ["transaksi", "kasbon-produk"] });
    },
  });
}