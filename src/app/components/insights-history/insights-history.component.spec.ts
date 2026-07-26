import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsHistoryComponent } from './insights-history.component';

describe('InsightsHistoryComponent', () => {
  let component: InsightsHistoryComponent;
  let fixture: ComponentFixture<InsightsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsightsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
