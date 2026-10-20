import { useMe } from "@/auth/hooks/useAuth";

export function DashboardPage() {
  const { data: user } = useMe();
  return (
    <div className="grid gap-1">
      <h2 className="text-2xl font-semibold">{user?.name}</h2>
    </div>
  );
}
