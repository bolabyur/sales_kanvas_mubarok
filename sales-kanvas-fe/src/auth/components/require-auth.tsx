import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMe } from "../hooks/useAuth";

export function RequireAuth() {
  const { data: user, isPending, isError, refetch } = useMe();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        Memuat…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-4 text-sm">
        <p>Tidak dapat terhubung ke server.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
