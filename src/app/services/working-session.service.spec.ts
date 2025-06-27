import { TestBed } from '@angular/core/testing';

import { WorkingSessionService } from './working-session.service';

describe('WorkingSessionService', () => {
  let service: WorkingSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkingSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
