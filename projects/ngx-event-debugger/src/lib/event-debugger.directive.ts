import { Directive, Input, OnInit, OnDestroy, HostListener, inject, ElementRef } from '@angular/core';
import { EventDebuggerService } from './event-debugger.service';

@Directive({ selector: '[debugEvents]', standalone: true })
export class DebugEventsDirective implements OnInit, OnDestroy {
  @Input('debugEvents') eventNames: string | string[] = [];
  @Input() debugSource?: string;

  private svc = inject(EventDebuggerService);
  private el = inject(ElementRef);
  private listeners: Array<() => void> = [];

  ngOnInit() {
    const names = Array.isArray(this.eventNames)
      ? this.eventNames
      : this.eventNames.split(',').map(s => s.trim()).filter(Boolean);

    const el: HTMLElement = this.el.nativeElement;
    const source = this.debugSource ?? `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>`;

    names.forEach(name => {
      const fn = (e: Event) => {
        this.svc.emit(name, undefined, 'custom', source);
      };
      el.addEventListener(name, fn);
      this.listeners.push(() => el.removeEventListener(name, fn));
    });
  }

  ngOnDestroy() { this.listeners.forEach(fn => fn()); }
}
