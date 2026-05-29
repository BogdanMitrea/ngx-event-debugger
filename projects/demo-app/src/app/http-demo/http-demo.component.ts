import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { EventDebuggerService } from 'ngx-event-debugger';

interface Post { userId: number; id: number; title: string; body: string; }

@Component({
  selector: 'app-http-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>🌐 HTTP Demo</h1>
      <p class="desc">HTTP requests are captured via the <code>eventDebuggerHttpInterceptor</code>. Click a button to fire a real request and watch the HTTP events in the panel.</p>

      <div class="btn-row">
        <button class="demo-btn" (click)="fetchPosts()" [disabled]="loading">
          {{ loading ? '⏳ Loading…' : '📥 GET /posts' }}
        </button>
        <button class="demo-btn" (click)="fetchUser()" [disabled]="loading">
          📥 GET /users/1
        </button>
        <button class="demo-btn" (click)="createPost()" [disabled]="loading">
          📤 POST /posts
        </button>
        <button class="demo-btn danger" (click)="triggerError()" [disabled]="loading">
          💥 Trigger 404
        </button>
      </div>

      <div class="results" *ngIf="posts.length > 0">
        <h2>Results ({{ posts.length }} posts)</h2>
        <div class="post-card" *ngFor="let post of posts.slice(0,5)">
          <div class="post-id">#{{ post.id }}</div>
          <div class="post-body">
            <div class="post-title">{{ post.title }}</div>
            <div class="post-text">{{ post.body | slice:0:100 }}…</div>
          </div>
        </div>
        <div class="post-more" *ngIf="posts.length > 5">+ {{ posts.length - 5 }} more</div>
      </div>

      <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }
    h1 { color: #0f172a; font-family: monospace; font-size: 1.8rem; margin: 0; }
    h2 { color: #1e293b; font-size: 1rem; margin: 0 0 12px; font-family: monospace; }
    .desc { color: #64748b; margin: 0; }
    code { background: #e2e8f0; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .demo-btn {
      padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;
      background: #2563eb; color: #fff; font-weight: 600; font-size: 13px;
      transition: all .15s;
    }
    .demo-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
    .demo-btn:disabled { opacity: .5; cursor: not-allowed; }
    .demo-btn.danger { background: #ef4444; }
    .demo-btn.danger:hover:not(:disabled) { background: #dc2626; }
    .results { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
    .post-card {
      display: flex; gap: 14px; padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .post-card:last-of-type { border-bottom: none; }
    .post-id { color: #94a3b8; font-family: monospace; font-size: 11px; min-width: 28px; padding-top: 2px; }
    .post-title { color: #0f172a; font-size: 13px; font-weight: 600; margin-bottom: 4px; text-transform: capitalize; }
    .post-text { color: #64748b; font-size: 12px; }
    .post-more { color: #94a3b8; text-align: center; padding-top: 12px; font-size: 12px; }
    .error-msg {
      background: #fee2e2; border: 1px solid #fecaca; color: #991b1b;
      border-radius: 8px; padding: 14px 18px; font-family: monospace; font-size: 13px;
    }
  `]
})
export class HttpDemoComponent implements OnInit, OnDestroy {
  http = inject(HttpClient);
  svc = inject(EventDebuggerService);
  posts: Post[] = [];
  loading = false;
  errorMsg = '';

  ngOnInit() {
    this.svc.emit('ngOnInit', null, 'lifecycle', 'HttpDemoComponent');
  }

  ngOnDestroy() {
    this.svc.emit('ngOnDestroy', null, 'lifecycle', 'HttpDemoComponent');
  }

  fetchPosts() {
    this.loading = true; this.errorMsg = '';
    this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts').subscribe({
      next: data => { this.posts = data; this.loading = false; },
      error: err => { this.errorMsg = err.message; this.loading = false; }
    });
  }

  fetchUser() {
    this.loading = true; this.errorMsg = '';
    this.http.get('https://jsonplaceholder.typicode.com/users/1').subscribe({
      next: () => { this.loading = false; },
      error: err => { this.errorMsg = err.message; this.loading = false; }
    });
  }

  createPost() {
    this.loading = true; this.errorMsg = '';
    this.http.post('https://jsonplaceholder.typicode.com/posts', {
      title: 'Debug Post', body: 'Created by EventDebugger demo', userId: 1
    }).subscribe({
      next: () => { this.loading = false; },
      error: err => { this.errorMsg = err.message; this.loading = false; }
    });
  }

  triggerError() {
    this.loading = true; this.errorMsg = '';
    this.http.get('https://jsonplaceholder.typicode.com/nonexistent-route').subscribe({
      next: () => { this.loading = false; },
      error: err => { this.errorMsg = `${err.status} ${err.statusText}`; this.loading = false; }
    });
  }
}