import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProdukDestruction, ProdukDestructionPayload } from "../types/produk-destruction.types";

const URL = "/transaksi/produk-destruction";
const KEY = ["transaksi", "produk-destruction"];

export function useProdukDestructions() {
  return useQuery({ queryKey: KEY, queryFn: () => api<ProdukDestruction[]>(URL) });
}

export function useCreateProdukDestruction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProdukDestructionPayload) =>
      api<ProdukDestruction>(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}