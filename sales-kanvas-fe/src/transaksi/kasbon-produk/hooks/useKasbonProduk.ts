import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { KasbonProduk, KasbonProdukPayload } from "../types/kasbon-produk.types";

const URL = "/transaksi/kasbon-produk";
const KEY = ["kasbon-produk"];

export function useKasbonProduks() {
  return useQuery({ queryKey: KEY, queryFn: () => api<KasbonProduk[]>(URL) });
}

export function useCreateKasbonProduk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: KasbonProdukPayload) =>
      api(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateKasbonStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`${URL}/${id}/update-status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}