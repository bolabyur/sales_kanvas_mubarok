import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "@/lib/api";
import type { ProdukIn, ProdukInPayload } from "../types/produk-in.types";

const URL = "/transaksi/produk-in";
const KEY = ["transaksi", "produk-in"];

export function useProdukIns() {
  return useQuery({ queryKey: KEY, queryFn: () => api<ProdukIn[]>(URL) });
}

export function useCreateProdukIn() {
  const qc = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: (payload: ProdukInPayload) =>
      api<ProdukIn>(URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "x-idempotency-key": idempotencyKey.current }
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["master", "batch"] });
      idempotencyKey.current = crypto.randomUUID();
    },
  });
}