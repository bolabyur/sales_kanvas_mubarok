import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { api, tokens } from "@/lib/api"; // ✅ Import tokens
import { ME_KEY } from "@/auth/hooks/useAuth";

export function useSocketNotifications() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ME_KEY,
    queryFn: () => api<any>("/auth/me"),
  });

  useEffect(() => {
    if (!me?.id) return;

    // Ambil access token dari localStorage
    const token = tokens.access();

    const socket = io("http://localhost:53103/notifications", {
      transports: ["websocket"],
      reconnection: true,
      // ✅ KIRIM TOKEN, BUKAN userId
      auth: { token }, 
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("new_notification", (data: any) => {
      toast(data.title, {
        id: `notif-${data.id}`,
        description: data.message,
        action: {
          label: "Lihat",
          onClick: () => {
            switch (data.entity_type) {
              case "PLAN": window.location.href = `/plan/${data.entity_id}`; break;
              case "BON": window.location.href = `/transaksi/kasbon-produk`; break;
              case "INVOICE": window.location.href = `/transaksi/invoice`; break;
              case "SETTLEMENT": window.location.href = `/transaksi/settlement`; break;
              case "RETURN": window.location.href = `/transaksi/retur`; break;
              case "PAYMENT": window.location.href = `/transaksi/pembayaran`; break;
              default: window.location.href = `/dashboard`;
            }
          },
        },
        duration: 8000,
      });

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.off("new_notification"); 
      socket.disconnect();
    };
  }, [me?.id, queryClient]);
}