import type { SubmitEvent } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageTitle } from "@/lib/app";
import { errorMessage } from "@/lib/errors";
import { useLogin, useMe } from "../hooks/useAuth";

export function LoginPage() {
  const { data: user } = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? "/";

  if (user) return <Navigate to={from} replace />;

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login.mutate(
      {
        username: String(form.get("username")).trim(),
        password: String(form.get("password")),
      },
      {
        onSuccess: () => navigate(from, { replace: true }),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <title>{pageTitle("Login")}</title>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" disabled={login.isPending} className="w-full">
              {login.isPending ? "Memproses…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
