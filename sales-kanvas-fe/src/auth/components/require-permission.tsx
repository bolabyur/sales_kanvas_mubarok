import { Outlet } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

/** page require permission. */
export function RequirePermission({ permission }: { permission: string }) {
  const can = usePermission();
  if (!can(permission)) {
    return (
      <p className="text-sm text-muted-foreground">
        Anda tidak punya akses ke halaman ini.
      </p>
    );
  }
  return <Outlet />;
}
