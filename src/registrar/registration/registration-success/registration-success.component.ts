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

import { DatePipe, NgIf } from '@angular/common';
import { Component, DoCheck, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { DialogOutcome, GrievanceContact, SyncStatus } from '../../../consent/core/consent.models';

/** The saved consent shown with the registration. */
export interface RegisteredConsent {
  consentId: string;
  outcome: DialogOutcome;
  capturedAt: string;
  syncStatus: SyncStatus;
  grievance: GrievanceContact | null;
  grievanceText: string;
  /** What happened to the Consent ID SMS, already in words. */
  smsLine: string;
}

export interface RegistrationSuccessData {
  beneficiaryID: string;
  /** null: no consent was taken, or it could not be saved. */
  consent: RegisteredConsent | null;
  /** The patient gave consent, but saving it failed; staff can retry. */
  consentFailed: boolean;
}

/** 'retry': save the consent again. */
export type RegistrationSuccessResult = 'retry' | undefined;

/** One message after registration: the Beneficiary ID and, when taken, the consent details. */
@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.component.html',
  styleUrls: ['../../../consent/consent-dialog/consent-dialog.component.css', '../../../consent/consent-theme.css'],
  standalone: true,
  imports: [NgIf, DatePipe, MatIconModule],
})
export class RegistrationSuccessComponent implements DoCheck {
  currentLanguageSet: any;
  private httpServiceService = inject(HttpServiceService);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegistrationSuccessData,
    private dialogRef: MatDialogRef<RegistrationSuccessComponent, RegistrationSuccessResult>
  ) {}

  ngDoCheck(): void {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  get text(): any {
    return this.currentLanguageSet?.consent;
  }

  get labels(): any {
    return this.currentLanguageSet?.bendetails;
  }

  retry(): void {
    this.dialogRef.close('retry');
  }

  close(): void {
    this.dialogRef.close(undefined);
  }
}
