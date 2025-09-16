import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadDialogComponent } from './rad-dialog.component';

describe('RadDialogComponent', () => {
  let component: RadDialogComponent;
  let fixture: ComponentFixture<RadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
