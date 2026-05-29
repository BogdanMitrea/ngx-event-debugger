import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventDebuggerService } from './event-debugger.service';
import { DebugEvent, EventCategory, EventDebuggerConfig, DEFAULT_CONFIG } from './event-debugger.models';

@Component({
  selector: 'ngx-event-debugger-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="edb-host" [class]="'edb-pos-' + position" [class.edb-minimized]="minimized">

  <!-- ── Collapsed FAB ─────────────────────────────── -->
  <button class="edb-fab" (click)="toggle()" [title]="minimized ? 'Open Event Debugger' : 'Minimize'">
    <span class="edb-fab-icon">{{ minimized ? '⚡' : '−' }}</span>
    <span class="edb-badge" *ngIf="minimized && newCount > 0">{{ newCount > 99 ? '99+' : newCount }}</span>
  </button>

  <!-- ── Panel ─────────────────────────────────────── -->
  <div class="edb-panel" *ngIf="!minimized">

    <!-- Header -->
    <div class="edb-header">
      <div class="edb-header-left">
        <span class="edb-logo">⚡</span>
        <span class="edb-title">Event Debugger</span>
        <span class="edb-count">{{ filtered.length }} / {{ events.length }}</span>
      </div>
      <div class="edb-header-right">
        <button class="edb-btn edb-btn-icon" (click)="togglePause()" [title]="paused ? 'Resume' : 'Pause'">
          {{ paused ? '▶' : '⏸' }}
        </button>
        <button class="edb-btn edb-btn-icon" (click)="clear()" title="Clear">🗑</button>
        <button class="edb-btn edb-btn-icon" (click)="toggleSettings()" title="Settings">⚙</button>
        <button class="edb-btn edb-btn-icon" (click)="toggle()" title="Minimize">−</button>
      </div>
    </div>

    <!-- Settings drawer -->
    <div class="edb-settings" *ngIf="showSettings">
      <div class="edb-settings-row">
        <span>Max events</span>
        <input type="number" [(ngModel)]="maxEventsInput" (change)="applyMaxEvents()" min="10" max="1000" step="10">
      </div>
      <div class="edb-settings-row">
        <span>DOM events</span>
        <label *ngFor="let cat of allCategories" class="edb-chip-label">
          <input type="checkbox" [checked]="activeCategories.has(cat)" (change)="toggleCategory(cat)">
          <span class="edb-chip" [class]="'edb-cat-' + cat">{{ cat }}</span>
        </label>
      </div>
      <div class="edb-settings-row">
        <span>Show timestamps</span>
        <input type="checkbox" [(ngModel)]="showTimestamps">
      </div>
      <div class="edb-settings-row">
        <span>Show payload</span>
        <input type="checkbox" [(ngModel)]="showPayload">
      </div>
    </div>

    <!-- Search + filters -->
    <div class="edb-toolbar">
      <div class="edb-search-wrap">
        <span class="edb-search-icon">🔍</span>
        <input class="edb-search" [(ngModel)]="search" placeholder="Filter events…" (ngModelChange)="applyFilter()">
        <button class="edb-search-clear" *ngIf="search" (click)="search=''; applyFilter()">✕</button>
      </div>
      <div class="edb-cats">
        <button *ngFor="let cat of allCategories"
          class="edb-cat-btn" [class]="'edb-cat-' + cat"
          [class.edb-cat-active]="activeCategories.has(cat)"
          (click)="toggleCategory(cat)"
          [title]="cat">
          {{ categoryIcon(cat) }} {{ cat }}
          <span class="edb-cat-count">{{ countByCategory(cat) }}</span>
        </button>
      </div>
    </div>

    <!-- Timeline -->
    <div class="edb-timeline" #timeline>
      <div class="edb-paused-banner" *ngIf="paused">
        ⏸ Paused — {{ queuedWhilePaused }} events suppressed
      </div>
      <div *ngIf="filtered.length === 0" class="edb-empty">
        <span class="edb-empty-icon">📭</span>
        <span>No events yet</span>
      </div>
      <div *ngFor="let evt of filtered; trackBy: trackById"
        class="edb-event" [class]="'edb-cat-bg-' + evt.category"
        [class.edb-event-new]="isNew(evt.id)"
        (click)="selectEvent(evt)">
        <div class="edb-event-left">
          <span class="edb-event-cat-dot" [class]="'edb-cat-' + evt.category"></span>
          <div class="edb-event-info">
            <span class="edb-event-name">{{ evt.name }}</span>
            <span class="edb-event-source" *ngIf="evt.source">{{ evt.source }}</span>
          </div>
        </div>
        <div class="edb-event-right">
          <span class="edb-cat-badge" [class]="'edb-cat-' + evt.category">{{ evt.category }}</span>
          <span class="edb-event-time" *ngIf="showTimestamps">{{ evt.timestamp | date:'HH:mm:ss.SSS' }}</span>
          <span class="edb-event-rel">{{ relTime(evt.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Detail drawer -->
    <div class="edb-detail" *ngIf="selected">
      <div class="edb-detail-header">
        <span class="edb-event-name">{{ selected.name }}</span>
        <button class="edb-btn edb-btn-icon" (click)="selected = null">✕</button>
      </div>
      <div class="edb-detail-body">
        <div class="edb-detail-row"><label>Category</label><span class="edb-cat-badge" [class]="'edb-cat-' + selected.category">{{ selected.category }}</span></div>
        <div class="edb-detail-row" *ngIf="selected.source"><label>Source</label><code>{{ selected.source }}</code></div>
        <div class="edb-detail-row"><label>Time</label><span>{{ selected.timestamp | date:'HH:mm:ss.SSS' }}</span></div>
        <div class="edb-detail-row" *ngIf="showPayload && selected.payload !== undefined">
          <label>Payload</label>
          <pre class="edb-json">{{ selected.payload | json }}</pre>
        </div>
        <div class="edb-detail-row" *ngIf="selected.stackTrace">
          <label>Stack</label>
          <pre class="edb-stack">{{ selected.stackTrace }}</pre>
        </div>
      </div>
    </div>

    <!-- Sparkline / activity bar -->
    <div class="edb-sparkline">
      <div *ngFor="let bar of sparkBars; let i = index"
        class="edb-spark-bar"
        [style.height.%]="bar.height"
        [class]="'edb-cat-' + bar.dominantCat"
        [title]="bar.count + ' events'">
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
:host { all: initial; }

.edb-host {
  position: fixed;
  z-index: 99999;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
}
.edb-pos-bottom-right { bottom: 16px; right: 16px; }
.edb-pos-bottom-left  { bottom: 16px; left:  16px; }
.edb-pos-top-right    { top: 16px;    right: 16px; }
.edb-pos-top-left     { top: 16px;    left:  16px; }

/* FAB */
.edb-fab {
  position: relative;
  width: 48px; height: 48px;
  border-radius: 50%;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.35);
  display: flex; align-items: center; justify-content: center;
  transition: transform .15s, box-shadow .15s;
}
.edb-fab:hover { transform: scale(1.1); box-shadow: 0 6px 32px rgba(37, 99, 235, 0.45); }
.edb-badge {
  position: absolute; top: -4px; right: -4px;
  background: #dc2626; color: #fff;
  font-size: 9px; font-weight: 700;
  border-radius: 10px; padding: 2px 5px;
  min-width: 16px; text-align: center;
  border: 2px solid #ffffff;
}

/* Panel */
.edb-panel {
  width: 480px;
  max-height: 600px;
  display: flex; flex-direction: column;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0,0,0,.2);
  overflow: hidden;
  animation: edb-slide-in .18s ease;
}
@keyframes edb-slide-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: none; }
}

/* Header */
.edb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: #f1f5f9;
  border-bottom: 2px solid #cbd5e1;
  flex-shrink: 0;
}
.edb-header-left { display: flex; align-items: center; gap: 8px; }
.edb-logo { font-size: 16px; }
.edb-title { font-weight: 700; color: #1e293b; letter-spacing: .02em; font-size: 13px; }
.edb-count { color: #475569; font-size: 10px; }
.edb-header-right { display: flex; gap: 4px; }

/* Buttons */
.edb-btn { background: transparent; border: 1.5px solid #cbd5e1; border-radius: 6px;
  color: #475569; cursor: pointer; transition: background .1s, color .1s, border .1s; }
.edb-btn:hover { background: #f0f4f8; color: #1e293b; border-color: #94a3b8; }
.edb-btn-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 13px; }

/* Settings */
.edb-settings {
  background: #f8fafc; border-bottom: 2px solid #cbd5e1;
  padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;
}
.edb-settings-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  color: #475569; font-size: 11px;
}
.edb-settings-row span:first-child { min-width: 80px; color: #475569; font-weight: 500; }
.edb-settings-row input[type=number] {
  background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 4px;
  color: #1e293b; padding: 2px 6px; width: 64px; font-weight: 500;
}
.edb-chip-label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.edb-chip-label input { cursor: pointer; }

/* Toolbar */
.edb-toolbar {
  padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;
  border-bottom: 2px solid #cbd5e1; flex-shrink: 0;
  background: #f8fafc;
}
.edb-search-wrap {
  display: flex; align-items: center; gap: 6px;
  background: #ffffff; border-radius: 6px; padding: 5px 8px; border: 1.5px solid #cbd5e1;
}
.edb-search { background: none; border: none; outline: none; color: #1e293b;
  flex: 1; font-size: 12px; font-family: inherit; font-weight: 500; }
.edb-search::placeholder { color: #94a3b8; }
.edb-search-icon { color: #94a3b8; font-size: 12px; }
.edb-search-clear { background: none; border: none; color: #94a3b8; cursor: pointer;
  font-size: 11px; padding: 0; }
.edb-search-clear:hover { color: #1e293b; }

.edb-cats { display: flex; gap: 4px; flex-wrap: wrap; }
.edb-cat-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 20px;
  border: 1.5px solid #cbd5e1; cursor: pointer;
  font-size: 10px; font-family: inherit; font-weight: 600;
  background: #f0f4f8; color: #475569;
  transition: all .12s; text-transform: uppercase; letter-spacing: .04em;
  opacity: .6;
}
.edb-cat-btn.edb-cat-active { opacity: 1; background: #e0e7ff; color: #1e40af; border-color: #1e40af; }
.edb-cat-count { font-size: 9px; background: rgba(0,0,0,.1); border-radius: 8px; padding: 0 4px; }

/* Timeline */
.edb-timeline {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  display: flex; flex-direction: column; gap: 1px;
  background: #ffffff;
  scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
}
.edb-timeline::-webkit-scrollbar { width: 4px; }
.edb-timeline::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.edb-empty { display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px; color: #cbd5e1; font-weight: 500; }
.edb-empty-icon { font-size: 32px; }

.edb-paused-banner {
  background: #fef08a; border-bottom: 2px solid #eab308;
  color: #854d0e; padding: 6px 12px; font-size: 11px; text-align: center; font-weight: 600;
  flex-shrink: 0;
}

.edb-event {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 12px; cursor: pointer;
  border-left: 3px solid transparent;
  transition: background .1s, border .1s;
  border-bottom: 1px solid #f1f5f9;
}
.edb-event:hover { background: #f8fafc; }
.edb-event-new { animation: edb-flash .6s ease-out; }
@keyframes edb-flash {
  0%   { background: rgba(234, 179, 8, 0.15); }
  100% { background: transparent; }
}

.edb-event-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.edb-event-cat-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.edb-event-info { display: flex; flex-direction: column; min-width: 0; }
.edb-event-name { color: #1e293b; font-size: 12px; font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.edb-event-source { color: #64748b; font-size: 10px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; font-weight: 500; }

.edb-event-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: 8px; }
.edb-event-time { color: #94a3b8; font-size: 9px; font-weight: 500; }
.edb-event-rel { color: #cbd5e1; font-size: 9px; font-weight: 500; }

/* Category colors */
.edb-cat-dom     { color: #0369a1; background: #e0f2fe; border-color: #06b6d4; }
.edb-cat-router  { color: #047857; background: #dcfce7; border-color: #22c55e; }
.edb-cat-custom  { color: #b45309; background: #fef3c7; border-color: #fcd34d; }
.edb-cat-http    { color: #dc2626; background: #fee2e2; border-color: #ef4444; }
.edb-cat-lifecycle { color: #6d28d9; background: #f3e8ff; border-color: #d946ef; }
.edb-cat-rxjs    { color: #ea580c; background: #fed7aa; border-color: #fb923c; }

.edb-event-cat-dot.edb-cat-dom      { background: #0284c7; }
.edb-event-cat-dot.edb-cat-router   { background: #16a34a; }
.edb-event-cat-dot.edb-cat-custom   { background: #d97706; }
.edb-event-cat-dot.edb-cat-http     { background: #dc2626; }
.edb-event-cat-dot.edb-cat-lifecycle{ background: #7c3aed; }
.edb-event-cat-dot.edb-cat-rxjs     { background: #ea580c; }

.edb-cat-badge {
  font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 10px;
  text-transform: uppercase; letter-spacing: .04em; border: 1.5px solid;
  white-space: nowrap;
}

.edb-cat-bg-dom      .edb-event:hover { border-left-color: #0284c7; background: #f0f9fe; }
.edb-cat-bg-router   .edb-event:hover { border-left-color: #16a34a; background: #f0fdf4; }
.edb-cat-bg-custom   .edb-event:hover { border-left-color: #d97706; background: #fffbeb; }
.edb-cat-bg-http     .edb-event:hover { border-left-color: #dc2626; background: #fef2f2; }
.edb-cat-bg-lifecycle .edb-event:hover { border-left-color: #7c3aed; background: #faf5ff; }
.edb-cat-bg-rxjs     .edb-event:hover { border-left-color: #ea580c; background: #fffbf0; }

/* Detail */
.edb-detail {
  border-top: 2px solid #cbd5e1; background: #f8fafc;
  max-height: 200px; overflow-y: auto; flex-shrink: 0;
}
.edb-detail-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1.5px solid #cbd5e1; background: #f1f5f9;
}
.edb-detail-header .edb-event-name { color: #1e293b; font-weight: 700; }
.edb-detail-body { padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
.edb-detail-row { display: flex; align-items: flex-start; gap: 10px; }
.edb-detail-row label { min-width: 64px; color: #64748b; font-size: 10px; padding-top: 2px; font-weight: 600; }
.edb-detail-row code { color: #0369a1; font-family: inherit; font-size: 11px; font-weight: 600; }
.edb-json, .edb-stack {
  color: #065f46; font-size: 10px; font-family: inherit; font-weight: 500;
  background: #f0fdf4; border: 1.5px solid #86efac;
  border-radius: 4px; padding: 6px 8px; margin: 0; max-height: 100px;
  overflow: auto; white-space: pre-wrap; word-break: break-all;
}
.edb-stack { color: #991b1b; background: #fef2f2; border-color: #fecaca; }

/* Sparkline */
.edb-sparkline {
  height: 28px; display: flex; align-items: flex-end; gap: 1px;
  padding: 4px 10px 0; background: #f8fafc; border-top: 2px solid #cbd5e1; flex-shrink: 0;
}
.edb-spark-bar {
  flex: 1; border-radius: 2px 2px 0 0; min-height: 2px;
  opacity: .8; transition: height .3s ease;
}
.edb-spark-bar.edb-cat-dom      { background: #0284c7; }
.edb-spark-bar.edb-cat-router   { background: #16a34a; }
.edb-spark-bar.edb-cat-custom   { background: #d97706; }
.edb-spark-bar.edb-cat-http     { background: #dc2626; }
.edb-spark-bar.edb-cat-lifecycle{ background: #7c3aed; }
.edb-spark-bar.edb-cat-rxjs     { background: #ea580c; }
  `]
})
export class EventDebuggerPanelComponent implements OnInit, OnDestroy {
  svc = inject(EventDebuggerService);

  minimized = false;
  paused = false;
  showSettings = false;
  showTimestamps = true;
  showPayload = true;
  search = '';
  selected: DebugEvent | null = null;
  activeCategories = new Set<EventCategory>(['dom','router','custom','http','lifecycle','rxjs']);
  allCategories: EventCategory[] = ['dom','router','custom','http','lifecycle','rxjs'];
  maxEventsInput = 200;
  position: string = 'bottom-right';
  newCount = 0;
  queuedWhilePaused = 0;

  events: DebugEvent[] = [];
  filtered: DebugEvent[] = [];
  sparkBars: { height: number; count: number; dominantCat: EventCategory }[] = [];

  private recentIds = new Set<string>();
  private sub = new Subscription();
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.sub.add(this.svc.events$.subscribe(evts => {
      this.events = evts;
      this.applyFilter();
      this.buildSparkline();
      this.cdr.markForCheck();
    }));
    this.sub.add(this.svc.newEvent$.subscribe(evt => {
      this.recentIds.add(evt.id);
      if (this.minimized) this.newCount++;
      setTimeout(() => { this.recentIds.delete(evt.id); this.cdr.markForCheck(); }, 800);
    }));
    this.sub.add(this.svc.paused$.subscribe(p => {
      this.paused = p;
      if (!p) this.queuedWhilePaused = 0;
      this.cdr.markForCheck();
    }));
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  toggle() {
    this.minimized = !this.minimized;
    if (!this.minimized) this.newCount = 0;
  }

  togglePause() { this.svc.togglePause(); }
  clear() { this.svc.clear(); this.selected = null; }
  toggleSettings() { this.showSettings = !this.showSettings; }

  toggleCategory(cat: EventCategory) {
    if (this.activeCategories.has(cat)) this.activeCategories.delete(cat);
    else this.activeCategories.add(cat);
    this.applyFilter();
  }

  applyFilter() {
    const s = this.search.toLowerCase();
    this.filtered = this.events.filter(e =>
      this.activeCategories.has(e.category) &&
      (!s || e.name.toLowerCase().includes(s) || (e.source ?? '').toLowerCase().includes(s))
    );
  }

  applyMaxEvents() { /* config is live on the service */ }

  selectEvent(evt: DebugEvent) {
    this.selected = this.selected?.id === evt.id ? null : evt;
  }

  isNew(id: string) { return this.recentIds.has(id); }

  countByCategory(cat: EventCategory) {
    return this.events.filter(e => e.category === cat).length;
  }

  relTime(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff/1000).toFixed(1)}s`;
    return `${Math.floor(diff/60000)}m`;
  }

  categoryIcon(cat: EventCategory) {
    return { dom:'🖱', router:'🧭', custom:'✨', http:'🌐', lifecycle:'⚙', rxjs:'🔁' }[cat] ?? '•';
  }

  trackById(_: number, e: DebugEvent) { return e.id; }

  buildSparkline() {
    const BUCKETS = 40;
    const now = Date.now();
    const window = 30_000; // 30s
    const bucketSize = window / BUCKETS;

    const bars = Array.from({ length: BUCKETS }, (_, i) => {
      const start = now - window + i * bucketSize;
      const end = start + bucketSize;
      const inBucket = this.events.filter(e => e.timestamp >= start && e.timestamp < end);
      const cats: Partial<Record<EventCategory, number>> = {};
      inBucket.forEach(e => { cats[e.category] = (cats[e.category] ?? 0) + 1; });
      const dominant = (Object.entries(cats).sort((a,b) => b[1]-a[1])[0]?.[0] ?? 'custom') as EventCategory;
      return { count: inBucket.length, dominantCat: dominant };
    });

    const maxCount = Math.max(...bars.map(b => b.count), 1);
    this.sparkBars = bars.map(b => ({ ...b, height: (b.count / maxCount) * 100 }));
  }
}
