import { EnvironmentProviders, APP_INITIALIZER, makeEnvironmentProviders, inject } from '@angular/core';
import { withInterceptors, provideHttpClient } from '@angular/common/http';
import { EventDebuggerService } from './event-debugger.service';
import { EventDebuggerConfig } from './event-debugger.models';
import { eventDebuggerHttpInterceptor } from './event-debugger-http.interceptor';

export function provideEventDebugger(config?: Partial<EventDebuggerConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const svc = inject(EventDebuggerService);
        return () => svc.init(config);
      },
    }
  ]);
}
