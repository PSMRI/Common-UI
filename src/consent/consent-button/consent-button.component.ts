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

import { NgIf } from '@angular/common';
import { Component, DoCheck, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { isConsentFeatureEnabled } from '../core/consent-feature';
import { ConsentDialogService } from '../consent-dialog.service';

/**
 * The "Consent" button in the patient header (FR-021a, AMM-2522). It opens the preference centre and
 * shows only when consent management is on and the patient is known.
 */
@Component({
  selector: 'app-consent-button',
  standalone: true,
  imports: [NgIf, MatIconModule],
  styleUrls: ['../consent-theme.css'],
  template: `
    <button *ngIf="visible" type="button" class="consent-btn consent-btn-secondary consent-button" (click)="open()">
      <mat-icon>verified_user</mat-icon>
      {{ text?.consentButton }}
    </button>
  `,
})
export class ConsentButtonComponent implements DoCheck {
  @Input() beneficiaryRegID: number | string | null | undefined = null;
  @Input() patientPhone: string | null | undefined = null;
  /** Emitted after the preference centre saved a change. */
  @Output() consentUpdated = new EventEmitter<void>();

  currentLanguageSet: any;
  private consentDialog = inject(ConsentDialogService);
  private httpServiceService = inject(HttpServiceService);

  ngDoCheck(): void {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  get text(): any {
    return this.currentLanguageSet?.consent;
  }

  get visible(): boolean {
    return isConsentFeatureEnabled() && this.regId !== null;
  }

  open(): void {
    const beneficiaryRegId = this.regId;
    if (beneficiaryRegId === null) {
      return;
    }
    this.consentDialog
      .openPreferenceCentre({ beneficiaryRegId, patientPhone: this.patientPhone || null })
      .subscribe((result) => {
        if (result.changed) {
          this.consentUpdated.emit();
        }
      });
  }

  private get regId(): number | null {
    const raw = this.beneficiaryRegID;
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const id = Number(raw);
    return isNaN(id) || id <= 0 ? null : id;
  }
}
