import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "@/lib/api";
import type { Settlement, SettlementPayload } from "../types/settlement.types";

const URL = "/transaksi/settlement";
const KEY = ["transaksi", "settlement"];

// Tipe data response dari backend (Pagination)
type SettlementResponse = {
  data: Settlement[];
  meta: { total: number; page: number; limit: number; total_pages: number };
};

export function useSettlements() {
  return useQuery({ 
    queryKey: KEY, 
    queryFn: () => api<SettlementResponse>(URL) // <--- Ubah tipe ke Object
  });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: (payload: SettlementPayload) =>
      api<Settlement>(URL, { 
        method: "POST", 
        body: JSON.stringify(payload),
        headers: { "x-idempotency-key": idempotencyKey.current }
      }),
    onSuccess: () => {
      // Refresh tabel setelah simpan
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["plan"] }); 
      idempotencyKey.current = crypto.randomUUID();
    },
  });
}