import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProShellComponent } from './pro-shell.component';

describe('ProShellComponent', () => {
  let component: ProShellComponent;
  let fixture: ComponentFixture<ProShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
