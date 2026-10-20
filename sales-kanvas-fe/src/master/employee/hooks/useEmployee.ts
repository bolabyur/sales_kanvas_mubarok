import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Employee, EmployeePayload } from "../types/employee.types";

const URL = "/master/employee";
const KEY = ["master", "employee"];

export function useEmployees() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Employee[]>(URL) });
}

export function useSaveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: EmployeePayload & { id?: number }) =>
      api<Employee>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
