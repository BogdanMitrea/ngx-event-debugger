import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { EventDebuggerPanelComponent } from 'ngx-event-debugger';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EventDebuggerPanelComponent],
  template: `
    <nav class="navbar">
      <div class="nav-brand">⚡ EventDebugger Demo</div>
      <div class="nav-links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
        <a routerLink="/form" routerLinkActive="active">Form Demo</a>
        <a routerLink="/http" routerLinkActive="active">HTTP Demo</a>
      </div>
    </nav>
    <main class="main-content">
      <router-outlet />
    </main>
    <ngx-event-debugger-panel />
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; height: 56px;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      position: sticky; top: 0; z-index: 100;
    }
    .nav-brand { color: #0f172a; font-weight: 700; font-family: monospace; font-size: 15px; }
    .nav-links { display: flex; gap: 4px; }
    .nav-links a {
      color: #64748b; text-decoration: none;
      padding: 6px 14px; border-radius: 6px; font-size: 14px;
      transition: all .15s;
    }
    .nav-links a:hover { background: #e2e8f0; color: #0f172a; }
    .nav-links a.active { background: #dbeafe; color: #1e40af; }
    .main-content { padding: 32px 24px; max-width: 900px; margin: 0 auto; }
  `]
})
export class App implements OnInit {
  ngOnInit() {}
}
