import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingSessionComponent } from './working-session.component';

describe('WorkingSessionComponent', () => {
  let component: WorkingSessionComponent;
  let fixture: ComponentFixture<WorkingSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkingSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
