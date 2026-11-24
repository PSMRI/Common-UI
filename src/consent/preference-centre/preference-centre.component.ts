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

import { DatePipe, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  PreferenceCentreBase,
  PreferenceCentreOptions,
  PreferenceCentreResult,
} from '../core/ui/preference-centre.base';
import { OtpVerifyComponent } from '../otp-verify/otp-verify.component';

/** Preference centre for HWC-UI and TM-UI (AMM-2522): opened from the "Consent" button in the patient header. */
@Component({
  selector: 'app-consent-preference-centre',
  templateUrl: './preference-centre.component.html',
  styleUrls: ['../consent-dialog/consent-dialog.component.css', '../consent-theme.css', './preference-centre.component.css'],
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, NgTemplateOutlet, DatePipe, UpperCasePipe, MatIconModule, OtpVerifyComponent],
})
export class PreferenceCentreComponent extends PreferenceCentreBase {
  constructor(
    @Inject(MAT_DIALOG_DATA) public options: PreferenceCentreOptions,
    private dialogRef: MatDialogRef<PreferenceCentreComponent, PreferenceCentreResult>
  ) {
    super();
  }

  /** Current consents and the history are shown on separate tabs; both stay in the page. */
  activeTab: 'current' | 'history' = 'current';

  protected closeDialog(result: PreferenceCentreResult): void {
    this.dialogRef.close(result);
  }
}
