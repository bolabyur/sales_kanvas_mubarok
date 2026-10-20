import { Outlet, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { pageTitle } from "@/lib/app";
import { AppSidebar } from "./app-sidebar";
import { isActive, NAV } from "./nav";

export function AdminLayout() {
  const { pathname } = useLocation();
  const title = NAV.flatMap((g) => g.items).find((i) =>
    isActive(pathname, i.url),
  )?.title;

  return (
    <SidebarProvider>
      <title>{pageTitle(title)}</title>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-center"
          />
          <h1 className="truncate text-sm font-medium">{title}</h1>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
