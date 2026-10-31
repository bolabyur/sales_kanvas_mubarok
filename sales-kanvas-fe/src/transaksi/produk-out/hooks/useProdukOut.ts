import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useProdukOut() {
  return useQuery({
    queryKey: ["produk-out"],
    queryFn: () => api<any>("/transaksi/produk-out"),
  });
}

export function useCreateProdukOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      api<any>("/transaksi/produk-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Onloading berhasil diproses!");
      queryClient.invalidateQueries({ queryKey: ["produk-out"] });
      queryClient.invalidateQueries({ queryKey: ["kasbon-produk"] });
      queryClient.invalidateQueries({ queryKey: ["batch"] }); 
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message;
      toast.error("Gagal memproses Onloading", { 
        description: Array.isArray(msg) ? msg[0].message : msg 
      });
    },
  });
}

export function useCancelProdukOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api<any>(`/transaksi/produk-out/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
        },
      }),
    onSuccess: () => {
      toast.success("Onloading berhasil dibatalkan. Stok dikembalikan.");
      queryClient.invalidateQueries({ queryKey: ["produk-out"] });
      queryClient.invalidateQueries({ queryKey: ["kasbon-produk"] });
      queryClient.invalidateQueries({ queryKey: ["batch"] });
    },
    onError: (error: any) => {
      toast.error("Gagal membatalkan Onloading", {
        description: error.message,
      });
    },
  });
}