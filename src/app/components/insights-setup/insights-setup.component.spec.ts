import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsSetupComponent } from './insights-setup.component';

describe('InsightsSetupComponent', () => {
  let component: InsightsSetupComponent;
  let fixture: ComponentFixture<InsightsSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsSetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsightsSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
