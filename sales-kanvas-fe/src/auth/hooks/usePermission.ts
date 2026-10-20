import { useMe } from "./useAuth";

/** Untuk memeriksa apakah user memiliki izin tertentu. */
export function usePermission() {
  const { data: user } = useMe();

  return (required: string) => {
    if (!user) return false;

    const role = user.role.name.toLowerCase();
    if (role === "super admin" || role === "superadmin" || user.role.id === 1) {
      return true;
    }

    const perms = user.permissions.map((p) => p.name);
    const [resource, action] = required.split(":");
    return (
      perms.includes(required) ||
      perms.includes(`${resource}:*`) ||
      (!!action && perms.includes(`${resource}:${action}:*`))
    );
  };
}
