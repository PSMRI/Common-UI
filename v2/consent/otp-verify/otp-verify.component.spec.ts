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

import { TestBed } from '@angular/core/testing';
import { ConsentApiService } from '../../../src/consent/core/consent-api.service';
import { otpVerifySuite } from '../../../src/consent/core/testing/otp-verify.suite';
import { OtpVerifyComponent } from './otp-verify.component';

otpVerifySuite(OtpVerifyComponent, 'v2');

describe('OtpVerifyComponent (v2) sent-to text', () => {
  function create(otpSentTo: string): OtpVerifyComponent {
    TestBed.configureTestingModule({
      imports: [OtpVerifyComponent],
      providers: [{ provide: ConsentApiService, useValue: {} }],
    });
    const component = TestBed.createComponent(OtpVerifyComponent).componentInstance;
    component.text = { otpSentTo };
    component.maskedPhone = '******3210';
    return component;
  }

  it('fills the {phone} placeholder', () => {
    expect(create('OTP sent to {phone}').otpSentText).toBe('OTP sent to ******3210');
  });

  it('appends the phone when the text has no placeholder', () => {
    expect(create('OTP sent to').otpSentText).toBe('OTP sent to ******3210');
  });
});
