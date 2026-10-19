import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_ONLY_KEY } from '../decorators/authenticated.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Fail-closed: handler TANPA @RequirePermission DAN TANPA @Authenticated
 * ditolak — pasang salah satunya di setiap endpoint yang berada di belakang
 * JwtAuthGuard. Super Admin (role bernama "Super Admin"/"superadmin", atau
 * role_id 1) bypass semua pengecekan permission.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const authOnly = this.reflector.getAllAndOverride<boolean>(
      AUTH_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length && !authOnly) {
      throw new ForbiddenException(
        'Endpoint ini belum diberi @RequirePermission atau @Authenticated',
      );
    }

    const user = context.switchToHttp().getRequest().user as
      | AuthenticatedUser
      | undefined;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!requiredPermissions?.length) {
      return true; // @Authenticated() saja — cukup login
    }

    if (this.isSuperAdmin(user)) {
      return true;
    }

    const userPermissions = this.extractUserPermissions(user);
    const hasPermission = requiredPermissions.some((required) =>
      this.matchesPermission(required, userPermissions),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private isSuperAdmin(user: AuthenticatedUser): boolean {
    const roleName = user.role?.name?.toLowerCase();
    return (
      roleName === 'super admin' ||
      roleName === 'superadmin' ||
      user.role?.id === 1
    );
  }

  private extractUserPermissions(user: AuthenticatedUser): string[] {
    return user.role?.permissionRoles?.map((pr) => pr.permission.name) ?? [];
  }

  private matchesPermission(required: string, userPerms: string[]): boolean {
    if (userPerms.includes(required)) return true;

    const [resource, action] = required.split(':');
    if (userPerms.includes(`${resource}:*`)) return true;
    if (action && userPerms.includes(`${resource}:${action}:*`)) return true;

    return false;
  }
}
