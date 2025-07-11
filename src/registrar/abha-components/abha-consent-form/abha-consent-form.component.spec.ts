import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaConsentFormComponent } from './abha-consent-form.component';

describe('AbhaConsentFormComponent', () => {
  let component: AbhaConsentFormComponent;
  let fixture: ComponentFixture<AbhaConsentFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaConsentFormComponent]
    });
    fixture = TestBed.createComponent(AbhaConsentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
