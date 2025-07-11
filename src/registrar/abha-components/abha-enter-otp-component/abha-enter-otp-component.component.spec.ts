import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaEnterOtpComponentComponent } from './abha-enter-otp-component.component';

describe('AbhaEnterOtpComponentComponent', () => {
  let component: AbhaEnterOtpComponentComponent;
  let fixture: ComponentFixture<AbhaEnterOtpComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaEnterOtpComponentComponent]
    });
    fixture = TestBed.createComponent(AbhaEnterOtpComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
