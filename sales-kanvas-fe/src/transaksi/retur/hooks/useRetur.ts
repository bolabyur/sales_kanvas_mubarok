import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "@/lib/api";
import type { Retur, ReturPayload } from "../types/retur.types";
import { toast } from "sonner";

const URL = "/transaksi/retur";
const KEY = ["transaksi", "retur"];

export function useReturs() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Retur[]>(URL) });
}

export function useCreateRetur() {
  const qc = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: (payload: ReturPayload) =>
      api<Retur>(URL, { 
        method: "POST", 
        body: JSON.stringify(payload),
        headers: { "x-idempotency-key": idempotencyKey.current }
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["master", "batch"] }); 
      qc.invalidateQueries({ queryKey: ["transaksi", "invoice"] });
      idempotencyKey.current = crypto.randomUUID();
    },
  });
}

// === TAMBAHAN BARU: Hook Approve Retur ===
export function useApproveRetur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Retur>(`${URL}/${id}/approve`, {
        method: "PATCH",
        headers: { "x-idempotency-key": crypto.randomUUID() },
      }),
    onSuccess: () => {
      toast.success("Retur berhasil disetujui! Piutang telah dipotong.");
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["transaksi", "invoice"] }); // Refresh data Invoice
      qc.invalidateQueries({ queryKey: ["master", "batch"] }); // Refresh data Batch
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message;
      toast.error("Gagal menyetujui retur", { 
        description: Array.isArray(msg) ? msg[0].message : msg 
      });
    }
  });
}