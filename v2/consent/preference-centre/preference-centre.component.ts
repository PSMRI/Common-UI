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

import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCloudOff,
  lucideInfo,
  lucideRotateCw,
  lucideShieldCheck,
  lucideX,
} from '@ng-icons/lucide';
import { ZardBadgeComponent } from 'Common-UI/v2/ui/badge';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardDialogRef, Z_MODAL_DATA } from 'Common-UI/v2/ui/dialog';
import { ZardTabComponent, ZardTabGroupComponent } from 'Common-UI/v2/ui/tabs';
import {
  PreferenceCentreBase,
  PreferenceCentreOptions,
  PreferenceCentreResult,
} from '../../../src/consent/core/ui/preference-centre.base';
import { OtpVerifyComponent } from '../otp-verify/otp-verify.component';

/** Preference centre for MMU-UI (AMM-2522): opened from the "Consent" button in the patient header. */
@Component({
  selector: 'app-consent-preference-centre',
  templateUrl: './preference-centre.component.html',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    NgIcon,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardTabComponent,
    ZardTabGroupComponent,
    OtpVerifyComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideCircleAlert,
      lucideCircleCheck,
      lucideCloudOff,
      lucideInfo,
      lucideRotateCw,
      lucideShieldCheck,
      lucideX,
    }),
  ],
})
export class PreferenceCentreComponent extends PreferenceCentreBase {
  constructor(
    @Inject(Z_MODAL_DATA) public options: PreferenceCentreOptions,
    private dialogRef: ZardDialogRef<
      PreferenceCentreComponent,
      PreferenceCentreResult
    >
  ) {
    super();
  }

  protected closeDialog(result: PreferenceCentreResult): void {
    this.dialogRef.close(result);
  }
}
