import { TestBed } from '@angular/core/testing';

import { ProShiftService } from './pro-shift.service';

describe('ProShiftService', () => {
  let service: ProShiftService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProShiftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds a queue from case types and advances on sign', () => {
    service.startShift({
      shiftEnd: new Date(Date.now() + 60 * 60 * 1000),
      caseTypes: [{ name: 'CT Chest', targetMinutes: 10, count: 2 }],
      breaks: []
    });

    expect(service.totalCases).toBe(2);
    expect(service.currentItem?.typeName).toBe('CT Chest');

    service.signCurrentCase();
    expect(service.completedCount).toBe(1);

    service.signCurrentCase();
    expect(service.shiftActive).toBeFalse();
    expect(service.history.length).toBe(1);
    expect(service.history[0].casesCompleted).toBe(2);
  });
});
