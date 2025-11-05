import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, PERMISSIONS, ROLE_HIERARCHY } from '../enums/role.enum';
import {
  ROLES_KEY,
  PERMISSIONS_KEY,
  OWNER_ONLY_KEY,
} from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // 1. 역할 기반 체크
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => user.role === role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Required roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // 2. 권한 기반 체크
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions) {
      const userPermissions = PERMISSIONS[user.role as Role] || [];
      const hasPermission = requiredPermissions.every((permission) => {
        // 와일드카드 권한 체크 (예: admin은 모든 권한)
        if (userPermissions.includes(`${permission.split(':')[0]}:*`)) {
          return true;
        }
        return userPermissions.includes(permission);
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          `Required permissions: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    // 3. 소유자 전용 체크
    const ownerOnly = this.reflector.getAllAndOverride<boolean>(
      OWNER_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (ownerOnly) {
      const resourceUserId = request.params.userId || request.params.id;
      const currentUserId = user.userId || user.id;

      if (!currentUserId) {
        throw new ForbiddenException('Invalid user session');
      }

      if (
        resourceUserId &&
        parseInt(resourceUserId) !== currentUserId &&
        user.role !== Role.ADMIN
      ) {
        throw new ForbiddenException('Access denied: Owner only');
      }
    }

    return true;
  }

  private hasPermission(userRole: Role, requiredPermission: string): boolean {
    const userPermissions = PERMISSIONS[userRole] || [];

    // 와일드카드 권한 체크
    const [resource] = requiredPermission.split(':');
    if (userPermissions.includes(`${resource}:*`)) {
      return true;
    }

    return userPermissions.includes(requiredPermission);
  }

  private hasHigherOrEqualRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }
}
