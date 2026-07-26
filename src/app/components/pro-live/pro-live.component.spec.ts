import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProLiveComponent } from './pro-live.component';

describe('ProLiveComponent', () => {
  let component: ProLiveComponent;
  let fixture: ComponentFixture<ProLiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProLiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProLiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
