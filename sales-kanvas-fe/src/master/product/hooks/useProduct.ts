import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Product, ProductWithPrices } from "../types/product.types";

const URL = "/master/product";
const HARGA_URL = "/master/produk-harga";
const KEY = ["master", "product"];

export function useProducts() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Product[]>(URL) });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, prices, ...payload }: ProductWithPrices) => {

      const product = await api<Product>(id ? `${URL}/${id}` : URL, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      if (prices && prices.length > 0) {
        for (const price of prices) {
          if (price.harga > 0) {
            await api(HARGA_URL, {
              method: "POST",
              body: JSON.stringify({
                produk_id: product.id,
                tipe_harga_id: price.tipe_harga_id,
                harga: price.harga,
              }),
            }).catch(() => {
            });
          }
        }
      }
      return product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["master", "produk-harga"] });
    },
    onError: (error: any) => {
      if (error instanceof ApiError) throw error;
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