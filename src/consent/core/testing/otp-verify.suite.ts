/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { Type } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ConsentApiService } from '../consent-api.service';
import { OtpVerifyBase } from '../ui/otp-verify.base';
import { mockOtpChallenge } from './consent.mock';

/** Behaviour suite run by each track's OTP verify spec. */
export function otpVerifySuite(OtpVerifyComponent: Type<OtpVerifyBase>, track: string): void {
  describe(`OtpVerifyComponent (${track})`, () => {
    let fixture: ComponentFixture<OtpVerifyBase>;
    let component: OtpVerifyBase;
    let api: jasmine.SpyObj<ConsentApiService>;
    let emitted: { challengeId: string; phone: string }[];
    const text = {
      phoneNumber: 'Phone',
      sendOtp: 'Send OTP',
      verifyOtp: 'Verify',
      otpSentTo: 'OTP sent to',
      enterOtp: 'Enter OTP',
      resendIn: 'Resend in',
      otpVerified: 'Verified',
      otpInvalid: 'Wrong OTP',
      serviceUnavailable: 'Unavailable',
    };

    function el<T extends HTMLElement>(selector: string): T {
      return fixture.nativeElement.querySelector(selector) as T;
    }

    function type(selector: string, value: string): void {
      const input = el<HTMLInputElement>(selector);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    beforeEach(() => {
      api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', ['sendOtp', 'verifyOtp']);
      api.sendOtp.and.returnValue(of(mockOtpChallenge()));
      api.verifyOtp.and.returnValue(of({ verified: true }));
      TestBed.configureTestingModule({
        imports: [OtpVerifyComponent],
        providers: [{ provide: ConsentApiService, useValue: api }],
      });
      fixture = TestBed.createComponent(OtpVerifyComponent);
      component = fixture.componentInstance;
      component.text = text;
      component.purpose = 'GUARDIAN';
      emitted = [];
      component.verified.subscribe((v) => emitted.push(v));
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('allows sending only for a valid 10-digit mobile', () => {
      type('input[name="consent-otp-phone"]', '12345');
      expect(el<HTMLButtonElement>('button.consent-otp-send').disabled).toBeTrue();
      component.send();
      expect(api.sendOtp).not.toHaveBeenCalled();
      type('input[name="consent-otp-phone"]', '9876543212');
      expect(el<HTMLButtonElement>('button.consent-otp-send').disabled).toBeFalse();
    });

    it('sends the OTP with a key and shows only the masked phone', () => {
      component.phone = '9876543212';
      fixture.detectChanges();
      el<HTMLButtonElement>('button.consent-otp-send').click();
      fixture.detectChanges();
      const [req, key] = api.sendOtp.calls.mostRecent().args;
      expect(req).toEqual({ purpose: 'GUARDIAN', phone: '9876543212' });
      expect(key).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('98******12');
      expect(fixture.nativeElement.textContent).not.toContain('9876543212');
    });

    it('passes the reference id when given', () => {
      component.phone = '9876543212';
      component.refId = 'g-1';
      component.send();
      expect(api.sendOtp.calls.mostRecent().args[0]).toEqual({ purpose: 'GUARDIAN', phone: '9876543212', refId: 'g-1' });
    });

    it('verifies a 6-digit OTP and emits the challenge and phone once', () => {
      component.phone = '9876543212';
      component.send();
      fixture.detectChanges();
      type('input[name="consent-otp-code"]', '123');
      expect(el<HTMLButtonElement>('button.consent-otp-verify').disabled).toBeTrue();
      component.verify();
      expect(api.verifyOtp).not.toHaveBeenCalled();
      type('input[name="consent-otp-code"]', '123456');
      el<HTMLButtonElement>('button.consent-otp-verify').click();
      fixture.detectChanges();
      expect(api.verifyOtp).toHaveBeenCalledWith('otp-1', '123456');
      expect(emitted).toEqual([{ challengeId: 'otp-1', phone: '9876543212' }]);
      expect(el('[role="status"]').textContent).toContain('Verified');
      expect(component.canVerify).toBeFalse();
      expect(component.canSend).toBeFalse();
    });

    it('shows a wrong OTP when not verified or refused', () => {
      component.phone = '9876543212';
      component.send();
      component.otp = '000000';
      api.verifyOtp.and.returnValue(of({ verified: false }));
      component.verify();
      expect(component.error).toBe('otpInvalid');
      api.verifyOtp.and.returnValue(throwError(() => ({ kind: 'FAILED', message: 'x' })));
      component.verify();
      fixture.detectChanges();
      expect(el('[role="alert"]').textContent).toContain('Wrong OTP');
      expect(emitted.length).toBe(0);
    });

    it('shows unavailable when the service is down', () => {
      component.phone = '9876543212';
      component.send();
      component.otp = '123456';
      api.verifyOtp.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
      component.verify();
      expect(component.error).toBe('serviceUnavailable');
      api.verifyOtp.and.returnValue(throwError(() => null));
      component.verify();
      expect(component.error).toBe('otpInvalid');
    });

    it('shows unavailable when sending fails', () => {
      api.sendOtp.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
      component.phone = '9876543212';
      component.send();
      expect(component.error).toBe('serviceUnavailable');
      expect(component.challengeId).toBeNull();
    });

    it('blocks resending for 30 seconds', fakeAsync(() => {
      component.phone = '9876543212';
      component.send();
      expect(component.resendIn).toBe(30);
      expect(component.canSend).toBeFalse();
      tick(29000);
      expect(component.resendIn).toBe(1);
      tick(1000);
      expect(component.resendIn).toBe(0);
      expect(component.canSend).toBeTrue();
      component.send();
      tick(5000);
      fixture.destroy();
      tick(30000);
      expect(component.resendIn).toBe(25);
    }));

    it('treats a null phone as empty and masks for display', () => {
      component.phone = null;
      expect(component.phoneNumber).toBe('');
      component.phone = '9876543212';
      expect(component.displayPhone).toBe('98******12');
    });
  });
}
