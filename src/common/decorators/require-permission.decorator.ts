import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/** Butuh permission spesifik, mis. `@RequirePermission('customer:read:full')`.
 * Mendukung wildcard `resource:*` dan `resource:action:*` di sisi role.
 * Super Admin bypass. Pakai bersama `@UseGuards(JwtAuthGuard, PermissionsGuard)`. */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
