import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Vehicle, VehiclePayload } from "../types/vehicle.types";

const URL = "/master/vehicle";
const KEY = ["master", "vehicle"];

export function useVehicles() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Vehicle[]>(URL) });
}

export function useSaveVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: VehiclePayload & { id?: number }) =>
      api<Vehicle>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
