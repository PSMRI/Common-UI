import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaGenerationSuccessComponentComponent } from './abha-generation-success-component.component';

describe('AbhaGenerationSuccessComponentComponent', () => {
  let component: AbhaGenerationSuccessComponentComponent;
  let fixture: ComponentFixture<AbhaGenerationSuccessComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaGenerationSuccessComponentComponent]
    });
    fixture = TestBed.createComponent(AbhaGenerationSuccessComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
