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

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/** Texts shown in the decline warning; the caller passes them in the current language. */
export interface DeclineConfirmData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

/** Warning before the patient's consent is declined (src track): go back, or confirm the decline. */
@Component({
  selector: 'app-consent-decline-confirm',
  standalone: true,
  imports: [MatIconModule],
  styleUrls: ['../consent-theme.css', './decline-confirm.component.css'],
  template: `
    <section class="decline-confirm" role="alertdialog" aria-modal="true" aria-labelledby="decline-confirm-title"
      aria-describedby="decline-confirm-message">
      <div class="decline-confirm-head">
        <span class="decline-confirm-icon"><mat-icon>warning_amber</mat-icon></span>
        <h2 id="decline-confirm-title" class="decline-confirm-title">{{ data.title }}</h2>
      </div>
      <p id="decline-confirm-message" class="decline-confirm-message">{{ data.message }}</p>
      <div class="decline-confirm-actions">
        <button type="button" class="consent-btn consent-btn-secondary decline-confirm-cancel" (click)="close(false)">
          {{ data.cancelLabel }}
        </button>
        <button type="button" class="consent-btn consent-btn-danger decline-confirm-ok" (click)="close(true)">
          {{ data.confirmLabel }}
        </button>
      </div>
    </section>
  `,
})
export class DeclineConfirmComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeclineConfirmData,
    private dialogRef: MatDialogRef<DeclineConfirmComponent, boolean>
  ) {}

  close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
