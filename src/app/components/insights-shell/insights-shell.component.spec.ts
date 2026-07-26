import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsShellComponent } from './insights-shell.component';

describe('InsightsShellComponent', () => {
  let component: InsightsShellComponent;
  let fixture: ComponentFixture<InsightsShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsightsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
