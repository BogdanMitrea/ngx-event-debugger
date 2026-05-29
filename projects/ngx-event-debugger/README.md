# ⚡ ngx-event-debugger
 
A visual event debugger for Angular applications. Adds a floating overlay panel that captures and displays DOM events, Router navigation, HTTP requests, and custom events like rxjs or component lifecycle in a live timeline with no browser extension required.
 
---
 
## Table of Contents
 
- [What is it?](#what-is-it)
- [Why does it exist?](#why-does-it-exist)
- [Key Capabilities](#key-capabilities)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Panel Reference](#panel-reference)
- [API Reference](#api-reference)
- [Demo Application](#demo-application)
- [Extending the Library](#extending-the-library)
- [Project Commands](#project-commands)
---
 
## What is it?
 
`ngx-event-debugger` is an Angular library that adds a floating debug panel to your app during development. The panel captures every significant event mouse clicks, keyboard input, page navigations, HTTP requests, and any custom events your code emits and displays them in a real-time, scrollable timeline.
 
It lives inside your running application rather than in the browser DevTools, so it works anywhere your app runs: local development, shared staging servers, CI preview deployments, or production behind a feature flag.
 
---
 
## Why does it exist?
 
Angular applications are event-driven. A single user action clicking "Add to Cart", for example might trigger a DOM event, which calls a service, which fires an HTTP request, which on completion navigates to a confirmation page. This entire chain happens in milliseconds and is invisible unless you have `console.log` calls scattered throughout your code.
 
Existing tools each cover only part of this:
 
- **Angular DevTools** (the official Chrome extension) shows component trees and change detection, but has no visibility into events or HTTP calls
- **The browser Network tab** shows HTTP requests but has no knowledge of what Angular event caused them
- **`console.log`** works but must be added manually everywhere, pollutes the console, and is removed before each deployment
`ngx-event-debugger` fills the gap with a single unified timeline showing all event types together, in the order they occurred, with payloads and sources visible on demand.
 
---
 
## Key Capabilities
 
- Automatic capture of DOM events (`click`, `keydown`, `input`, `change`, `focus`, `blur`, and any others you configure) with no code changes in your components
- Automatic capture of Angular Router lifecycle events (`NavigationStart`, `NavigationEnd`, `NavigationError`, and others)
- Automatic capture of HTTP requests and responses via an Angular HTTP interceptor, including timing in milliseconds
- Manual emission of named custom events from any component or service via a simple inject-and-call API
- `[debugEvents]` directive for declaratively tracking events on specific elements without touching TypeScript
- Real-time filtering by event category, text search, pause/resume, and configurable history size
- 30-second rolling sparkline histogram showing event frequency over time
- Zero external dependencies beyond Angular and RxJS, both already present in every Angular project
---
 
## Architecture
 
### File overview
 
| File | Responsibility |
|---|---|
| `event-debugger.models.ts` | TypeScript interfaces and types the shared data contract |
| `event-debugger.service.ts` | Central event store and capture logic DOM listeners, router subscription, public emit API |
| `event-debugger-http.interceptor.ts` | Angular HTTP interceptor recording outgoing requests and responses |
| `event-debugger.directive.ts` | The `[debugEvents]` attribute directive for declarative element-level tracking |
| `event-debugger-panel.component.ts` | The self-contained overlay UI with all styles, filters, and visualisations |
| `provide-event-debugger.ts` | The `provideEventDebugger()` function that wires everything together at bootstrap |
 
### The one-door principle
 
Every event, regardless of source, flows through a single internal method called `_push()` on the service. DOM listeners call it. The HTTP interceptor calls it. The router subscription calls it. Your own components call it indirectly through `emit()`.
 
```
DOM listener     ─┐
Router events    ─┼─→ _push() → BehaviorSubject → Panel UI
HTTP interceptor ─┤
svc.emit()       ─┘
```
 
Adding a new capture source (WebSocket messages, NgRx actions, etc.) requires only calling `_push()` from one new place. Nothing else changes.
 
### Event categories
 
| Category | What it captures |
|---|---|
| `dom` | Native browser events: click, keydown, input, change, focus, blur |
| `router` | Angular Router lifecycle: NavigationStart, NavigationEnd, NavigationCancel, NavigationError |
| `http` | HTTP requests (method, URL) and responses (status code, duration) captured by the interceptor |
| `custom` | Named events emitted manually by your components via `svc.emit()` |
| `rxjs` | RxJS observable events such as form `valueChanges` and `statusChanges` |
| `lifecycle` | Angular component lifecycle hooks when manually instrumented |
 
---
 
## Installation & Setup
 
### Step 1 Copy the library source
 
Copy the `projects/ngx-event-debugger` folder into your Angular workspace. Then add a path alias in your root `tsconfig.json`:
 
```json
"paths": {
  "ngx-event-debugger": [
    "./projects/ngx-event-debugger/src/public-api.ts"
  ]
}
```
 
### Step 2 Register the HTTP interceptor
 
In `app.config.ts`, pass the interceptor to `provideHttpClient`:
 
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { eventDebuggerHttpInterceptor } from 'ngx-event-debugger';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([eventDebuggerHttpInterceptor])),
  ],
};
```
 
### Step 3 Register the debugger provider
 
```ts
import { provideEventDebugger } from 'ngx-event-debugger';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideEventDebugger({
      captureDomEvents: true,
      captureRouterEvents: true,
      captureHttpEvents: true,
      maxEvents: 300,
      position: 'bottom-right',
    }),
  ],
};
```
 
### Step 4 Add the panel to your root component
 
```ts
import { EventDebuggerPanelComponent } from 'ngx-event-debugger';
 
@Component({
  imports: [RouterOutlet, EventDebuggerPanelComponent],
  template: `
    <router-outlet />
    <ngx-event-debugger-panel />
  `,
})
export class App {}
```
 
---
 
## Usage
 
### Automatic capture
 
Once the provider and interceptor are registered, the following are captured with no further instrumentation:
 
- All DOM events listed in the `domEvents` config on every element in the page
- All Angular Router lifecycle events as the user navigates between routes
- All HTTP requests made via `HttpClient`, including responses and errors
### Emitting custom events
 
```ts
import { EventDebuggerService } from 'ngx-event-debugger';
 
@Component({ ... })
export class CheckoutComponent {
  svc = inject(EventDebuggerService);
 
  onPurchase(order: Order) {
    this.svc.emit('purchase:complete', { orderId: order.id, total: order.total }, 'custom', 'CheckoutComponent');
  }
}
```
 
| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Event name. Use namespaced names like `user:login` or `cart:add` for clarity. |
| `payload` | `unknown` | Any data to attach. Shown in the detail drawer when clicked. Optional. |
| `category` | `EventCategory` | One of: `'dom'` `'router'` `'http'` `'custom'` `'rxjs'` `'lifecycle'`. Defaults to `'custom'`. |
| `source` | `string` | Human-readable description of where the event came from, e.g. the component name. Optional. |
 
### The `[debugEvents]` directive
 
Track events on any element without modifying component TypeScript:
 
```ts
import { DebugEventsDirective } from 'ngx-event-debugger';
 
@Component({
  imports: [DebugEventsDirective],
  template: `
    <!-- Array of event names -->
    <button [debugEvents]="['click', 'focus']" debugSource="submit-btn">Submit</button>
 
    <!-- Comma-separated string -->
    <div [debugEvents]="'click,mouseenter,mouseleave'" debugSource="card">Hover me</div>
  `
})
export class MyComponent {}
```
 
The directive attaches native event listeners on `ngOnInit` and removes them on `ngOnDestroy` automatically.
 
### Tracking RxJS streams
 
```ts
import { tap } from 'rxjs';
 
this.form.valueChanges.pipe(
  tap(val => this.svc.emit('form:change', val, 'rxjs', 'MyFormComponent'))
).subscribe();
```
 
### Tracking lifecycle hooks
 
```ts
ngOnInit() {
  this.svc.emit('ngOnInit', null, 'lifecycle', 'ProductListComponent');
}
 
ngOnDestroy() {
  this.svc.emit('ngOnDestroy', null, 'lifecycle', 'ProductListComponent');
}
```
 
### Disabling in production
 
```ts
import { environment } from './environments/environment';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors(
        environment.production ? [] : [eventDebuggerHttpInterceptor]
      )
    ),
    ...(environment.production ? [] : [provideEventDebugger()]),
  ],
};
```
 
---
 
## Panel Reference
 
### Panel zones
 
| Zone | Description |
|---|---|
| **Header bar** | Logo, event count (filtered / total), and controls: pause/resume, clear, settings, minimise |
| **Settings drawer** | Configure max events, toggle visible categories, toggle timestamp and payload display |
| **Toolbar** | Search input and category filter pills click any pill to toggle that category |
| **Timeline** | Scrollable event list, newest first. Each row shows name, source, category badge, and relative time. Click any row to open the detail drawer. |
| **Detail drawer** | Full payload as formatted JSON, source, timestamp, and optional stack trace |
| **Sparkline** | 40-bucket histogram of the last 30 seconds, colour-coded by dominant category |
 
### Controls
 
| Button | Behaviour |
|---|---|
| ⏸ / ▶ | Toggles capture. While paused, new events are suppressed. A banner shows how many were missed. |
| 🗑 | Clears all captured events from memory. Does not affect the running application. |
| ⚙ | Opens or closes the settings drawer. |
| − | Minimises the panel to a floating button (FAB). A red badge counts new events captured while minimised. |
| ✕ | Closes the detail drawer. |
 
---
 
## API Reference
 
### `EventDebuggerService`
 
| Member | Type | Description |
|---|---|---|
| `init(config?)` | `void` | Initialises the service. Called automatically by `provideEventDebugger()`. |
| `emit(name, payload?, category?, source?)` | `void` | Emits a custom event into the debugger timeline. |
| `clear()` | `void` | Removes all events from history. |
| `pause()` / `resume()` / `togglePause()` | `void` | Controls event capture. |
| `events$` | `Observable<DebugEvent[]>` | Full event history, newest first. Emits the complete array on every change. |
| `newEvent$` | `Observable<DebugEvent>` | Emits each individual event as it is captured. |
| `paused$` | `Observable<boolean>` | Stream of the current paused state. |
| `isPaused` | `boolean` | Synchronous read of paused state. |
| `snapshot` | `DebugEvent[]` | Synchronous read of the current event history. |
 
### `EventDebuggerConfig`
 
| Option | Default | Description |
|---|---|---|
| `categories` | all | Array of `EventCategory` values to capture. Events in unlisted categories are silently dropped. |
| `maxEvents` | `200` | Maximum events to keep in memory. Older events are removed when the limit is reached. |
| `captureDomEvents` | `true` | Whether to attach document-level listeners for DOM events. |
| `domEvents` | 7 events | Default: `['click','keydown','input','change','submit','focus','blur']`. |
| `captureRouterEvents` | `true` | Whether to subscribe to Angular Router events. |
| `captureHttpEvents` | `true` | Informational flag. Actual HTTP capture also requires the interceptor to be registered. |
| `captureStackTraces` | `false` | If `true`, a stack trace is captured with every event. Has a performance cost. |
| `startMinimized` | `false` | If `true`, the panel starts collapsed to the FAB. |
| `position` | `'bottom-right'` | Corner of the viewport. One of: `'bottom-right'` `'bottom-left'` `'top-right'` `'top-left'`. |
 
### `DebugEvent` interface
 
```ts
interface DebugEvent {
  id: string;               // Unique identifier
  timestamp: number;        // Unix milliseconds
  name: string;             // Event name, e.g. "click" or "user:login"
  category: EventCategory;  // dom | router | http | custom | rxjs | lifecycle
  source?: string;          // Human-readable origin, e.g. "<button#submit>"
  payload?: unknown;        // Arbitrary data attached to the event
  duration?: number;        // Milliseconds HTTP events only
  metadata?: Record<string, unknown>;
  stackTrace?: string;      // Present only when captureStackTraces is true
}
```
 
---
 
## Demo Application
 
The workspace includes a full Angular application at `projects/demo-app` that exercises every feature across three pages.
 
```bash
npm install
npx ng serve demo-app
# Open http://localhost:4200
```
 
### Home page
 
Demonstrates DOM event capture, custom event emission, router navigation, and the `[debugEvents]` directive. Includes buttons emitting `button:click`, `user:login`, `cart:add`, and `modal:open` events, a text input generating `keydown` events, and a `div` tracked declaratively with the directive.
 
### Form Demo page
 
Demonstrates RxJS tracking with Angular Reactive Forms. Emits `form:statusChange` and `form:valueChange` (debounced to 300ms) as `rxjs` category events, and `form:submit` on submission.
 
### HTTP Demo page
 
Demonstrates HTTP capture using real requests to `jsonplaceholder.typicode.com`. Four scenarios: `GET /posts`, `GET /users/1`, `POST /posts`, and a deliberate 404 to show error capture.
 
---
 
## Extending the Library
 
### Capturing NgRx actions
 
```ts
import { MetaReducer, ActionReducer } from '@ngrx/store';
import { EventDebuggerService } from 'ngx-event-debugger';
 
export function debugMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    const svc = inject(EventDebuggerService);
    svc.emit(action.type, action, 'custom', 'NgRx');
    return reducer(state, action);
  };
}
```
 
### Capturing WebSocket messages
 
```ts
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private svc = inject(EventDebuggerService);
 
  connect(url: string) {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      this.svc.emit('ws:message', JSON.parse(event.data), 'custom', 'WebSocketService');
    };
    return ws;
  }
}
```