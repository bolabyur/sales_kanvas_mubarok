import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Outlet, OutletPayload } from "../types/outlet.types";

const URL = "/master/outlets";
const KEY = ["master", "outlet"];

export function useOutlet() { return useQuery({ queryKey: KEY, queryFn: () => api<Outlet[]>(URL) }); }
export function useSaveOutlet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: OutletPayload & { id?: number }) => api<Outlet>(id ? `${URL}/${id}` : URL, { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) }),
    onSuccess: () => { toast.success("Berhasil disimpan!"); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e) => { if (e instanceof ApiError) toast.error(e.message); },
  });
}
export function useDeleteOutlet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Berhasil dihapus!"); qc.invalidateQueries({ queryKey: KEY }); },
  });
}