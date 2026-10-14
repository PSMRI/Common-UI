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

import { Directive, EventEmitter, Input, OnDestroy, Output, inject, ChangeDetectorRef } from '@angular/core';
import { ConsentApiService } from '../consent-api.service';
import { OtpPurpose } from '../consent.models';
import { maskPhone, uuidV4 } from '../evidence.util';

const RESEND_SECONDS = 30;
const OTP_PATTERN = /^\d{6}$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

/** Phone + OTP entry shared by OTP proof, guardian and access approval (FR-014, FR-016, FR-018, FR-028). */
@Directive()
export abstract class OtpVerifyBase implements OnDestroy {
  @Input() text: any;
  @Input() purpose: OtpPurpose = 'CONSENT';
  @Input() refId: string | null = null;
  @Input() set phone(value: string | null) {
    this.phoneNumber = value || '';
  }
  @Output() verified = new EventEmitter<{ challengeId: string; phone: string }>();

  phoneNumber = '';
  otp = '';
  challengeId: string | null = null;
  maskedPhone = '';
  sending = false;
  verifying = false;
  isVerified = false;
  error: 'otpInvalid' | 'serviceUnavailable' | null = null;
  resendIn = 0;

  protected consentApi = inject(ConsentApiService);
  // Zard's dialog container is OnPush: async updates must mark this view for checking.
  protected cdr = inject(ChangeDetectorRef);
  private timer: ReturnType<typeof setInterval> | null = null;

  get canSend(): boolean {
    return PHONE_PATTERN.test(this.phoneNumber) && !this.sending && this.resendIn === 0 && !this.isVerified;
  }

  get canVerify(): boolean {
    return !!this.challengeId && OTP_PATTERN.test(this.otp) && !this.verifying && !this.isVerified;
  }

  get displayPhone(): string {
    return this.maskedPhone || maskPhone(this.phoneNumber);
  }

  send(): void {
    if (!this.canSend) {
      return;
    }
    this.sending = true;
    this.error = null;
    const request = this.refId
      ? { purpose: this.purpose, phone: this.phoneNumber, refId: this.refId }
      : { purpose: this.purpose, phone: this.phoneNumber };
    this.consentApi.sendOtp(request, uuidV4()).subscribe({
      next: (challenge) => {
        this.sending = false;
        this.challengeId = challenge.challengeId;
        this.maskedPhone = challenge.maskedPhone;
        this.startResendTimer();
        this.cdr.markForCheck();
      },
      error: () => {
        this.sending = false;
        this.error = 'serviceUnavailable';
        this.cdr.markForCheck();
      },
    });
  }

  verify(): void {
    if (!this.canVerify) {
      return;
    }
    const challengeId = this.challengeId as string;
    this.verifying = true;
    this.error = null;
    this.consentApi.verifyOtp(challengeId, this.otp).subscribe({
      next: (res) => {
        this.verifying = false;
        if (res.verified) {
          this.isVerified = true;
          this.verified.emit({ challengeId, phone: this.phoneNumber });
        } else {
          this.error = 'otpInvalid';
        }
        this.cdr.markForCheck();
      },
      error: (err: { kind?: string }) => {
        this.verifying = false;
        this.error = err && err.kind === 'UNAVAILABLE' ? 'serviceUnavailable' : 'otpInvalid';
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startResendTimer(): void {
    this.stopTimer();
    this.resendIn = RESEND_SECONDS;
    this.timer = setInterval(() => {
      this.resendIn--;
      if (this.resendIn <= 0) {
        this.resendIn = 0;
        this.stopTimer();
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
