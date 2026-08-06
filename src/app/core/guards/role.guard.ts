import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services';
import { UserRole } from '../models';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
}
