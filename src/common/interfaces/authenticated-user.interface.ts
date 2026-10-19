import { Permission, PermissionRole, Role, User } from '@prisma/client';

/** Bentuk req.user setelah JwtStrategy.validate — User + role + daftar
 * permission role tsb (dipakai PermissionsGuard & response /me, /login). */
export type AuthenticatedUser = User & {
  role: Role & {
    permissionRoles: (PermissionRole & { permission: Permission })[];
  };
};
