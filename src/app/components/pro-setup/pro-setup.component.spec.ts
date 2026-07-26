import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProSetupComponent } from './pro-setup.component';

describe('ProSetupComponent', () => {
  let component: ProSetupComponent;
  let fixture: ComponentFixture<ProSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProSetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
