export type EventCategory = 'dom' | 'router' | 'custom' | 'http' | 'lifecycle' | 'rxjs';

export interface DebugEvent {
  id: string;
  timestamp: number;
  name: string;
  category: EventCategory;
  source?: string;
  payload?: unknown;
  duration?: number;        // ms, for paired start/end events
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export interface EventDebuggerConfig {
  /** Which categories to capture */
  categories?: EventCategory[];
  /** Max events to keep in history */
  maxEvents?: number;
  /** Capture DOM events globally */
  captureDomEvents?: boolean;
  /** DOM event names to listen to */
  domEvents?: string[];
  /** Capture Router events */
  captureRouterEvents?: boolean;
  /** Capture HTTP events via interceptor */
  captureHttpEvents?: boolean;
  /** Show stack traces */
  captureStackTraces?: boolean;
  /** Start minimized */
  startMinimized?: boolean;
  /** Position of the debugger panel */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const DEFAULT_CONFIG: EventDebuggerConfig = {
  categories: ['dom', 'router', 'custom', 'http', 'lifecycle', 'rxjs'],
  maxEvents: 200,
  captureDomEvents: true,
  domEvents: ['click', 'keydown', 'input', 'change', 'submit', 'focus', 'blur'],
  captureRouterEvents: true,
  captureHttpEvents: true,
  captureStackTraces: false,
  startMinimized: false,
  position: 'bottom-right',
};
