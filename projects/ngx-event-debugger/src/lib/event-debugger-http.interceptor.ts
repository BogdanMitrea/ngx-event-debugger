import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { EventDebuggerService } from './event-debugger.service';

let _id = 0;

export const eventDebuggerHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const svc = inject(EventDebuggerService);
  const start = Date.now();
  const reqId = ++_id;

  svc._push({
    id: `http-req-${reqId}`,
    timestamp: start,
    name: `HTTP ${req.method}`,
    category: 'http',
    source: req.url,
    payload: { method: req.method, url: req.url, params: req.params.toString() || undefined },
  });

  return next(req).pipe(
    tap({
      next: event => {
        if (event instanceof HttpResponse) {
          svc._push({
            id: `http-res-${reqId}`,
            timestamp: Date.now(),
            name: `HTTP ${req.method} ${event.status}`,
            category: 'http',
            source: req.url,
            duration: Date.now() - start,
            payload: { status: event.status, statusText: event.statusText, url: event.url, duration: `${Date.now() - start}ms` },
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        svc._push({
          id: `http-err-${reqId}`,
          timestamp: Date.now(),
          name: `HTTP ERROR ${err.status}`,
          category: 'http',
          source: req.url,
          duration: Date.now() - start,
          payload: { status: err.status, message: err.message },
        });
      }
    })
  );
};
