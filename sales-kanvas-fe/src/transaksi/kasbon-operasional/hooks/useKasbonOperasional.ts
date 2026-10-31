import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "@/lib/api";
import type { KasbonOperasional } from "../types/kasbon-operasional.types";

const URL = "/transaksi/kasbon-operasional";
const KEY = ["transaksi", "kasbon-operasional"];

export function useKasbonOperasionals() {
  return useQuery({ queryKey: KEY, queryFn: () => api<KasbonOperasional[]>(URL) });
}

export function useCreateKasbonOperasional() {
  const qc = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: (payload: any) =>
      api<KasbonOperasional>(URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "x-idempotency-key": idempotencyKey.current },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      idempotencyKey.current = crypto.randomUUID();
    },
  });
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