import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventDebuggerService, DebugEventsDirective } from 'ngx-event-debugger';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DebugEventsDirective],
  template: `
    <div class="page">
      <div class="hero">
        <h1>⚡ Angular Event Debugger</h1>
        <p class="subtitle">A visual debugger that tracks DOM events, router navigation, HTTP calls, and custom events in real time.</p>
      </div>

      <div class="section">
        <h2>🖱 DOM Events</h2>
        <p>Click or interact with these elements — watch the panel update:</p>
        <div class="btn-grid">
          <button class="demo-btn" (click)="onBtnClick('primary')">Primary Button</button>
          <button class="demo-btn secondary" (click)="onBtnClick('secondary')">Secondary</button>
          <button class="demo-btn danger" (click)="onBtnClick('danger')">Danger</button>
        </div>
        <input class="demo-input" placeholder="Type here to see keydown events…" />
      </div>

      <div class="section">
        <h2>✨ Custom Events</h2>
        <p>Emit named custom events from your components:</p>
        <div class="btn-grid">
          <button class="demo-btn" (click)="emitCustom('user:login', { userId: 42 })">Emit user:login</button>
          <button class="demo-btn" (click)="emitCustom('cart:add', { productId: 'SKU-007', qty: 1 })">Emit cart:add</button>
          <button class="demo-btn" (click)="emitCustom('modal:open', { modalId: 'settings' })">Emit modal:open</button>
          <button class="demo-btn secondary" (click)="emitCustom('notification:show', { type: 'success', msg: 'Done!' })">Emit notification</button>
        </div>
      </div>

      <div class="section">
        <h2>🧭 Router Events</h2>
        <p>Navigate between pages — router lifecycle events are automatically captured:</p>
        <div class="btn-grid">
          <a routerLink="/form" class="demo-btn">Go to Form Demo</a>
          <a routerLink="/http" class="demo-btn">Go to HTTP Demo</a>
          <a routerLink="/" class="demo-btn secondary">Back to Home</a>
        </div>
      </div>

      <div class="section">
        <h2>🏷 debugEvents Directive</h2>
        <p>Use the <code>[debugEvents]</code> directive to track specific events on any element:</p>
        <div class="directive-demo" [debugEvents]="['click', 'mouseenter', 'mouseleave']" debugSource="div#directive-demo">
          Hover or click me — tracked via directive
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 32px; }
    .hero { text-align: center; padding: 24px 0; }
    h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 12px; font-family: monospace; }
    .subtitle { color: #64748b; font-size: 1.05rem; max-width: 560px; margin: 0 auto; }
    h2 { color: #1e293b; font-size: 1.1rem; margin: 0 0 8px; font-family: monospace; }
    p { color: #64748b; margin: 0 0 16px; font-size: .9rem; }
    code { background: #e2e8f0; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
    .btn-grid { display: flex; gap: 10px; flex-wrap: wrap; }
    .demo-btn {
      padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;
      background: #2563eb; color: #fff; font-weight: 600; font-size: 13px;
      transition: all .15s; text-decoration: none; display: inline-block;
    }
    .demo-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
    .demo-btn.secondary { background: #cbd5e1; }
    .demo-btn.secondary:hover { background: #94a3b8; }
    .demo-btn.danger { background: #ef4444; }
    .demo-btn.danger:hover { background: #dc2626; }
    .demo-input {
      width: 100%; box-sizing: border-box;
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;
      color: #0f172a; padding: 10px 14px; font-size: 14px; margin-top: 12px;
      outline: none; transition: border .15s; font-family: inherit;
    }
    .demo-input:focus { border-color: #3b82f6; }
    .directive-demo {
      background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px;
      padding: 24px; text-align: center; color: #64748b; cursor: pointer;
      transition: all .15s; font-family: monospace;
    }
    .directive-demo:hover { border-color: #3b82f6; color: #3b82f6; background: #dbeafe22; }
  `]
})
export class HomeComponent {
  svc = inject(EventDebuggerService);

  onBtnClick(label: string) {
    this.svc.emit('button:click', { label }, 'custom', 'HomeComponent');
  }

  emitCustom(name: string, payload: Record<string, unknown>) {
    this.svc.emit(name, payload, 'custom', 'HomeComponent');
  }
}
