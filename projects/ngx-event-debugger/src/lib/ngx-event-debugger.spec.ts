import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxEventDebugger } from './ngx-event-debugger';

describe('NgxEventDebugger', () => {
  let component: NgxEventDebugger;
  let fixture: ComponentFixture<NgxEventDebugger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxEventDebugger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxEventDebugger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
