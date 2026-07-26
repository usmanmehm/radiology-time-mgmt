import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakComponent } from './break.component';

describe('BreakComponent', () => {
  let component: BreakComponent;
  let fixture: ComponentFixture<BreakComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreakComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects an end time at or before the start time', () => {
    component.breaks = [{ start: new Date(2026, 0, 1, 10, 0), end: new Date(2026, 0, 1, 9, 30), confirmed: false }];
    expect(component.validationError(0)).toContain('after the start time');
  });

  it('rejects a break that ends after maxTime', () => {
    component.maxTime = new Date(2026, 0, 1, 17, 0);
    component.breaks = [{ start: new Date(2026, 0, 1, 16, 30), end: new Date(2026, 0, 1, 17, 30), confirmed: false }];
    expect(component.validationError(0)).toContain('before the session ends');
  });

  it('rejects overlapping breaks', () => {
    component.breaks = [
      { start: new Date(2026, 0, 1, 10, 0), end: new Date(2026, 0, 1, 10, 30), confirmed: false },
      { start: new Date(2026, 0, 1, 10, 15), end: new Date(2026, 0, 1, 10, 45), confirmed: false }
    ];
    expect(component.validationError(1)).toContain('overlaps');
  });

  it('accepts a valid, non-overlapping break', () => {
    component.maxTime = new Date(2026, 0, 1, 17, 0);
    component.breaks = [{ start: new Date(2026, 0, 1, 10, 0), end: new Date(2026, 0, 1, 10, 30), confirmed: false }];
    expect(component.validationError(0)).toBeNull();
  });

  it('confirmBreak does not confirm an invalid break', () => {
    component.breaks = [{ start: new Date(2026, 0, 1, 10, 0), end: new Date(2026, 0, 1, 9, 30), confirmed: false }];
    component.confirmBreak(0);
    expect(component.breaks[0].confirmed).toBeFalse();
  });
});
