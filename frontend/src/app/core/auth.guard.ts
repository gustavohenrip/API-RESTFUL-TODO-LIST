import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.token() ? true : router.createUrlTree(['/login']);
};

export const anonymousGuard: CanActivateFn = (): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.token() ? router.createUrlTree(['/tasks']) : true;
};
