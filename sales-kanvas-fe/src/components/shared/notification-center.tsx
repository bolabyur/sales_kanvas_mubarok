import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, XCircle, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export function NotificationCenter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<any[]>("/notifications"),
    refetchInterval: 30000, // Fallback polling
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api(`/notifications/read-all`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleClick = (notif: any) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    
    if (notif.entity_type === "PLAN") navigate(`/plan/${notif.entity_id}`);
    if (notif.entity_type === "INVOICE") navigate(`/transaksi/invoice`);
    if (notif.entity_type === "BON") navigate(`/transaksi/kasbon-produk`);
    
    setOpen(false);
  };

  const renderIcon = (type: string) => {
    if (type.includes("APPROVED")) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (type.includes("CANCELLED")) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* PERBAIKAN: Base UI pakai render prop, bukan asChild */}
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifikasi</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto p-0 text-primary hover:bg-transparent" onClick={() => markAllRead.mutate()}>
              <Check className="h-3 w-3 mr-1" /> Tandai semua dibaca
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all">
          <div className="px-4 pt-3 pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Semua ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Belum Dibaca ({unreadCount})</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="h-75">
            {/* TAB SEMUA */}
            <TabsContent value="all" className="m-0">
              {notifications.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>}
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition flex gap-3 ${!n.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />}
                </div>
              ))}
            </TabsContent>

            {/* TAB BELUM DIBACA */}
            <TabsContent value="unread" className="m-0">
              {notifications.filter(n => !n.is_read).map((n) => (
                <div 
                  key={n.id} 
                  className="p-4 border-b cursor-pointer hover:bg-muted/50 transition flex gap-3 bg-primary/5"
                  onClick={() => handleClick(n)}
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))}
              {unreadCount === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Semua notifikasi sudah dibaca.</p>}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}