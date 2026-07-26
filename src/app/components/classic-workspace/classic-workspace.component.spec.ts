import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassicWorkspaceComponent } from './classic-workspace.component';

describe('ClassicWorkspaceComponent', () => {
  let component: ClassicWorkspaceComponent;
  let fixture: ComponentFixture<ClassicWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassicWorkspaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassicWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
