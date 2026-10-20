import { Permission, PermissionRole, Role, User } from '@prisma/client';


export type AuthenticatedUser = User & {
  role: Role & {
    permissionRoles: (PermissionRole & { permission: Permission })[];
  };
};
