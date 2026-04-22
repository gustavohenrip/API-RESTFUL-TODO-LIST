import { Routes } from '@angular/router';
import { anonymousGuard, authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tasks',
  },
  {
    path: 'login',
    canActivate: [anonymousGuard],
    loadComponent: () => import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/tasks.component').then((m) => m.TasksComponent),
  },
  {
    path: '**',
    redirectTo: 'tasks',
  },
];
