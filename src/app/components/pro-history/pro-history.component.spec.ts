import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProHistoryComponent } from './pro-history.component';

describe('ProHistoryComponent', () => {
  let component: ProHistoryComponent;
  let fixture: ComponentFixture<ProHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
