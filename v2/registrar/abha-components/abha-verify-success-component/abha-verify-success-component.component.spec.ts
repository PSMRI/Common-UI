import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaVerifySuccessComponentComponent } from './abha-verify-success-component.component';

describe('AbhaVerifySuccessComponentComponent', () => {
  let component: AbhaVerifySuccessComponentComponent;
  let fixture: ComponentFixture<AbhaVerifySuccessComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaVerifySuccessComponentComponent]
    });
    fixture = TestBed.createComponent(AbhaVerifySuccessComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
