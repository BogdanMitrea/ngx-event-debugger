import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideEventDebugger } from 'ngx-event-debugger';
import { eventDebuggerHttpInterceptor } from 'ngx-event-debugger';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([eventDebuggerHttpInterceptor])),
    provideEventDebugger({
      captureDomEvents: true,
      captureRouterEvents: true,
      captureHttpEvents: true,
      domEvents: ['click', 'keydown', 'input', 'change', 'submit', 'focus', 'blur'],
      maxEvents: 300,
      position: 'bottom-right',
    }),
  ],
};
