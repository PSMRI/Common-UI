import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaEnterMobileOtpComponentComponent } from './abha-enter-mobile-otp-component.component';

describe('AbhaEnterMobileOtpComponentComponent', () => {
  let component: AbhaEnterMobileOtpComponentComponent;
  let fixture: ComponentFixture<AbhaEnterMobileOtpComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaEnterMobileOtpComponentComponent]
    });
    fixture = TestBed.createComponent(AbhaEnterMobileOtpComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
