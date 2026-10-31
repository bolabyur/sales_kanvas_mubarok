import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react"; 
import { api } from "@/lib/api";
import type { Invoice, InvoicePayload } from "../types/invoice.types";

const URL = "/transaksi/invoice";
const KEY = ["transaksi", "invoice"];

export function useInvoices() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Invoice[]>(URL) });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const idempotencyKey = useRef(crypto.randomUUID()); 

  return useMutation({
    mutationFn: (payload: InvoicePayload) =>
      api<Invoice>(URL, { 
        method: "POST", 
        body: JSON.stringify(payload),
        headers: { "x-idempotency-key": idempotencyKey.current } 
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["master", "batch"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      idempotencyKey.current = crypto.randomUUID(); 
    },
  });
}