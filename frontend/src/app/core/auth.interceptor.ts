import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.token();

  const authenticatedRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        session.clear();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
