import { HttpInterceptorFn } from '@angular/common/http';

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
