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
      
      // 1. Bersihkan nilai null / undefined
      const cleanPayload: any = {};
      Object.keys(payload).forEach((key) => {
        const val = (payload as any)[key];
        if (val !== null && val !== undefined && val !== "") {
          cleanPayload[key] = val;
        }
      });

      // 2. PERBAIKAN: Ubah tipe harga "Retail" menjadi "FIXED" agar lolos validasi Zod backend
      if (cleanPayload.type_price !== "FIXED" && cleanPayload.type_price !== "PERSENTASE") {
        cleanPayload.type_price = "FIXED";
      }

      // 3. Sertakan array harga (jika ada)
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
      // Cukup console.log, JANGAN throw error agar React tidak crash
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