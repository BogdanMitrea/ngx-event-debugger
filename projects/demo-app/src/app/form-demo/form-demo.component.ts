import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EventDebuggerService } from 'ngx-event-debugger';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
    <div class="page">
      <h1>📝 Form Demo</h1>
      <p class="desc">Reactive form events are captured as custom events. Value changes, validation, and submit are all tracked.</p>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Username</label>
            <input formControlName="username" placeholder="Enter username…">
            <span class="hint" *ngIf="form.get('username')?.invalid && form.get('username')?.touched">
              Min 3 characters required
            </span>
          </div>
          <div class="field">
            <label>Email</label>
            <input formControlName="email" type="email" placeholder="user@example.com">
            <span class="hint" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Valid email required
            </span>
          </div>
          <div class="field">
            <label>Role</label>
            <select formControlName="role">
              <option value="">Select role…</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div class="field">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="agree">
              I agree to the terms
            </label>
          </div>
          <button type="submit" class="submit-btn" [disabled]="form.invalid">
            Submit Form
          </button>
        </form>

        <div class="form-state">
          <div class="state-row">
            <span class="state-label">Status</span>
            <span class="state-val" [class.valid]="form.valid" [class.invalid]="form.invalid">
              {{ form.status }}
            </span>
          </div>
          <div class="state-row">
            <span class="state-label">Dirty</span>
            <span class="state-val">{{ form.dirty }}</span>
          </div>
          <div class="state-row">
            <span class="state-label">Touched</span>
            <span class="state-val">{{ form.touched }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }
    h1 { color: #0f172a; font-family: monospace; font-size: 1.8rem; margin: 0; }
    .desc { color: #64748b; margin: 0; }
    .form-card {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 28px; display: grid; grid-template-columns: 1fr 200px; gap: 32px;
    }
    form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    input, select {
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;
      color: #0f172a; padding: 10px 14px; font-size: 14px;
      outline: none; transition: border .15s; font-family: inherit;
    }
    input:focus, select:focus { border-color: #3b82f6; }
    .hint { color: #ef4444; font-size: 11px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px;
      font-weight: normal; text-transform: none; letter-spacing: normal; cursor: pointer; }
    .submit-btn {
      padding: 12px; border-radius: 8px; border: none; cursor: pointer;
      background: #2563eb; color: #fff; font-weight: 700; font-size: 14px;
      transition: all .15s;
    }
    .submit-btn:hover:not(:disabled) { background: #1d4ed8; }
    .submit-btn:disabled { opacity: .4; cursor: not-allowed; }
    .form-state { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
    .state-row { display: flex; flex-direction: column; gap: 2px; }
    .state-label { color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .state-val { color: #64748b; font-family: monospace; font-size: 13px; }
    .state-val.valid { color: #16a34a; }
    .state-val.invalid { color: #ef4444; }
  `]
})
export class FormDemoComponent implements OnInit, OnDestroy {
  svc = inject(EventDebuggerService);
  fb = inject(FormBuilder);
  private sub = new Subscription();

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    agree: [false, Validators.requiredTrue],
  });

  ngOnInit() {
    this.sub.add(this.form.statusChanges.subscribe(status => {
      this.svc.emit('form:statusChange', { status }, 'rxjs', 'FormDemoComponent');
    }));
    this.sub.add(
      this.form.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(val => {
          this.svc.emit('form:valueChange', val, 'rxjs', 'FormDemoComponent');
        })
    );
  }

  onSubmit() {
    this.svc.emit('form:submit', this.form.value, 'custom', 'FormDemoComponent');
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
