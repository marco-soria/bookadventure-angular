import { Routes } from '@angular/router';
import { adminBlockGuard } from '../core/guards/admin-block.guard';
import { adminGuard, authGuard } from '../core/guards/auth.guard';
import { Login } from '../features/login/login';
import { Register } from '../features/register/register';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('../features/home/home').then((m) => m.Home),
  },
  {
    path: 'book/:id',
    loadComponent: () =>
      import('../features/book-detail/book-detail').then(
        (m) => m.BookDetailComponent
      ),
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('../features/admin-panel/admin-panel').then((m) => m.AdminPanel),
    canActivate: [adminGuard],
  },
  {
    path: 'my-account',
    loadComponent: () =>
      import('../features/my-account/my-account').then((m) => m.MyAccount),
    canActivate: [authGuard, adminBlockGuard],
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
