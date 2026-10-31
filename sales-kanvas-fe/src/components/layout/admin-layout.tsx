import { Outlet, useLocation } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { pageTitle } from "@/lib/app";
import { AppSidebar } from "./app-sidebar";
import { isActive, NAV } from "./nav";
import { NotificationCenter } from "@/components/shared/notification-center"; 
import { useSocketNotifications } from "@/hooks/useSocketNotifications";

export function AdminLayout() {
  const { pathname } = useLocation();
  const title = NAV.flatMap((g) => g.items).find((i) =>
    isActive(pathname, i.url),
  )?.title;

  useSocketNotifications();

  return (
    <SidebarProvider>
      <title>{pageTitle(title)}</title>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center justify-between px-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">{title || "Sales Kanvas"}</h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}