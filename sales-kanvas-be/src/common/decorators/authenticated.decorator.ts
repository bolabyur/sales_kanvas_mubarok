import { SetMetadata } from '@nestjs/common';

export const AUTH_ONLY_KEY = 'auth_only';

/**
 * Tandai endpoint yang cukup butuh login (user terautentikasi) tanpa
 * permission spesifik. Diperlukan karena PermissionsGuard bersifat
 * fail-closed: endpoint tanpa @RequirePermission DAN tanpa @Authenticated
 * akan DITOLAK.
 */
export const Authenticated = () => SetMetadata(AUTH_ONLY_KEY, true);
