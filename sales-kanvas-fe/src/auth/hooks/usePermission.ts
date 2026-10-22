import { useMe } from "./useAuth";

export function usePermission() {
  const { data: user } = useMe();

  return (required: string) => {
    if (!user) return false;

    const role = user.role.name.toLowerCase();
    if (role === "super admin" || role === "superadmin" || role === "sales" || user.role.id === 1) {
      return true;
    }

    const perms = user.permissions.map((p) => p.name);
    const [resource, action] = required.split(":");
    
    const hasAccess = 
      perms.includes(required) ||
      perms.includes(`${resource}:*`) ||
      (!!action && perms.includes(`${resource}:${action}:*`));

    if (hasAccess) return true;

    if (action === "write") {
      return perms.includes(`${resource}:create`) || 
             perms.includes(`${resource}:update`) || 
             perms.includes(`${resource}:delete`);
    }

    return false;
  };
}