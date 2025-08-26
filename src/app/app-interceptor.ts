import { HttpInterceptorFn } from '@angular/common/http';

export const appInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};

// export const tokenExpiredInterceptor: HttpInterceptorFn = (req, next) => {
//   const authService = inject(Auth);

//   if (authService.getIsLoggedIn()) {
//     const currentDate = new Date();
//     if (currentDate > authService.getTokenExpiration()) {
//       authService.logout(true);
//       return EMPTY;
//     }
//   }

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    return next(
      req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token),
      })
    );
  } else {
    return next(req);
  }
};
