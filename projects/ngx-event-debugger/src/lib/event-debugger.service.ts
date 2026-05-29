import { Injectable, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationError, NavigationCancel, RoutesRecognized } from '@angular/router';
import { BehaviorSubject, Subject, Subscription, filter } from 'rxjs';
import { DebugEvent, EventDebuggerConfig, EventCategory, DEFAULT_CONFIG } from './event-debugger.models';

let _idCounter = 0;
function uid() { return `evt-${Date.now()}-${_idCounter++}`; }

@Injectable({ providedIn: 'root' })
export class EventDebuggerService implements OnDestroy {
  private config: EventDebuggerConfig = { ...DEFAULT_CONFIG };
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router, { optional: true });

  private _events$ = new BehaviorSubject<DebugEvent[]>([]);
  private _newEvent$ = new Subject<DebugEvent>();
  private _paused$ = new BehaviorSubject<boolean>(false);

  events$ = this._events$.asObservable();
  newEvent$ = this._newEvent$.asObservable();
  paused$ = this._paused$.asObservable();

  private domListeners: Array<{ el: EventTarget; name: string; fn: EventListener }> = [];
  private subs = new Subscription();
  private initialized = false;

  configure(config: Partial<EventDebuggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  init(config?: Partial<EventDebuggerConfig>) {
    if (config) this.configure(config);
    if (this.initialized) return;
    this.initialized = true;

    if (!isPlatformBrowser(this.platformId)) return;

    if (this.config.captureDomEvents) this._initDomCapture();
    if (this.config.captureRouterEvents && this.router) this._initRouterCapture();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  emit(name: string, payload?: unknown, category: EventCategory = 'custom', source?: string) {
    this._push({ id: uid(), timestamp: Date.now(), name, category, payload, source,
      ...(this.config.captureStackTraces ? { stackTrace: new Error().stack } : {}) });
  }

  clear() { this._events$.next([]); }

  pause() { this._paused$.next(true); }
  resume() { this._paused$.next(false); }
  togglePause() { this._paused$.next(!this._paused$.value); }

  get isPaused() { return this._paused$.value; }
  get snapshot() { return this._events$.value; }

  // ── Internal ──────────────────────────────────────────────────────────────

  _push(event: DebugEvent) {
    if (this._paused$.value) return;
    if (!this.config.categories?.includes(event.category)) return;

    this._newEvent$.next(event);
    const current = this._events$.value;
    const max = this.config.maxEvents ?? 200;
    const next = [event, ...current].slice(0, max);
    this._events$.next(next);
  }

  private _initDomCapture() {
    const events = this.config.domEvents ?? [];
    events.forEach(name => {
      const fn: EventListener = (e: Event) => {
        const target = e.target as HTMLElement;
        this._push({
          id: uid(), timestamp: Date.now(), name, category: 'dom',
          source: target ? `<${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}${target.className ? '.' + (target.className as string).split(' ').filter(Boolean).join('.') : ''}>` : 'unknown',
          payload: name === 'keydown' ? { key: (e as KeyboardEvent).key, code: (e as KeyboardEvent).code } : undefined,
        });
      };
      document.addEventListener(name, fn, { capture: true, passive: true });
      this.domListeners.push({ el: document, name, fn });
    });
  }

  private _initRouterCapture() {
    const r = this.router!;
    this.subs.add(r.events.subscribe(evt => {
      const name = evt.constructor.name;
      let category: EventCategory = 'router';
      const payload: Record<string, unknown> = {};

      if (evt instanceof NavigationStart) payload['url'] = evt.url;
      else if (evt instanceof NavigationEnd) { payload['url'] = evt.url; payload['urlAfterRedirects'] = evt.urlAfterRedirects; }
      else if (evt instanceof NavigationError) payload['error'] = String(evt.error);
      else if (evt instanceof NavigationCancel) payload['reason'] = evt.reason;
      else if (evt instanceof RoutesRecognized) payload['url'] = evt.url;

      this._push({ id: uid(), timestamp: Date.now(), name, category, payload });
    }));
  }

  ngOnDestroy() {
    this.domListeners.forEach(({ el, name, fn }) => el.removeEventListener(name, fn, true));
    this.subs.unsubscribe();
  }
}
