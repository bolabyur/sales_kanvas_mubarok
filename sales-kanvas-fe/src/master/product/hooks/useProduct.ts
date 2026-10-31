import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product, ProductWithPrices } from "../types/product.types";

const URL = "/master/product";
const KEY = ["master", "product"];

export function useProducts() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Product[]>(URL) });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, prices, ...payload }: ProductWithPrices) => {
      
      const cleanPayload: any = {};
      Object.keys(payload).forEach((key) => {
        const val = (payload as any)[key];
        if (val !== null && val !== undefined && val !== "") {
          cleanPayload[key] = val;
        }
      });

      if (cleanPayload.type_price !== "FIXED" && cleanPayload.type_price !== "PERSENTASE") {
        cleanPayload.type_price = "FIXED";
      }

      if (prices && prices.length > 0) {
        cleanPayload.prices = prices;
      }

      const product = await api<Product>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(cleanPayload),
      });

      return product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (error: any) => {
      console.error("API Error:", error); 
    }
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`${URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}