import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Batch, BatchPayload } from "../types/batch.types";

const URL = "/master/batch";
const KEY = ["master", "batch"];

export function useBatch() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Batch[]>(URL) });
}

export function useSaveBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: BatchPayload & { id?: number }) =>
      api<Batch>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (error) => {
      if (error instanceof ApiError) toast.error(error.message);
    },
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}