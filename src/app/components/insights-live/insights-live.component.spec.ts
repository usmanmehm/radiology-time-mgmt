import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsLiveComponent } from './insights-live.component';

describe('InsightsLiveComponent', () => {
  let component: InsightsLiveComponent;
  let fixture: ComponentFixture<InsightsLiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsLiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsightsLiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
