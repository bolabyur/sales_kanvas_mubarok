import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { KanvasReturn, KanvasReturnPayload } from "../types/kanvas-return.types";

const URL = "/transaksi/kanvas-return";
const KEY = ["transaksi", "kanvas-return"];

export function useKanvasReturns() {
  return useQuery({ queryKey: KEY, queryFn: () => api<KanvasReturn[]>(URL) });
}

export function useCreateKanvasReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: KanvasReturnPayload) =>
      api<KanvasReturn>(URL, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["master", "batch"] });
    },
  });
}