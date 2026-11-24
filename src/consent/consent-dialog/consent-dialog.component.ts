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

import { DatePipe, NgIf, UpperCasePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { ConsentDialogOptions, ConsentDialogResult } from '../core/consent.models';
import { ConsentDialogBase } from '../core/ui/consent-dialog.base';
import { DeclineConfirmComponent, DeclineConfirmData } from '../decline-confirm/decline-confirm.component';
import { LanguageStepComponent } from './language-step/language-step.component';
import { NoticeStepComponent } from './notice-step/notice-step.component';
import { ProofStepComponent } from './proof-step/proof-step.component';
import { PurposesStepComponent } from './purposes-step/purposes-step.component';

@Component({
  selector: 'app-consent-dialog',
  templateUrl: './consent-dialog.component.html',
  styleUrls: ['./consent-dialog.component.css', '../consent-theme.css'],
  standalone: true,
  imports: [
    NgIf,
    UpperCasePipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    LanguageStepComponent,
    NoticeStepComponent,
    PurposesStepComponent,
    ProofStepComponent,
  ],
})
export class ConsentDialogComponent extends ConsentDialogBase {
  constructor(
    @Inject(MAT_DIALOG_DATA) public options: ConsentDialogOptions,
    private dialogRef: MatDialogRef<ConsentDialogComponent, ConsentDialogResult>,
    private matDialog: MatDialog
  ) {
    super();
  }

  /** The decline warning in the consent style, with aligned Go back / Confirm decline buttons. */
  protected override confirmDecline(): Observable<boolean> {
    const text = this.text || {};
    return this.matDialog
      .open<DeclineConfirmComponent, DeclineConfirmData, boolean>(DeclineConfirmComponent, {
        data: {
          title: text.declineWarningTitle || text.decline || '',
          message: text.cannotContinue || '',
          confirmLabel: text.confirmDecline || '',
          cancelLabel: text.declineGoBack || text.close || '',
        },
        width: 'min(440px, 92vw)',
        maxWidth: '92vw',
        autoFocus: '.decline-confirm-cancel',
        panelClass: 'consent-decline-confirm-panel',
      })
      .afterClosed()
      .pipe(map(confirmed => confirmed === true));
  }

  protected closeDialog(result: ConsentDialogResult): void {
    this.dialogRef.close(result);
  }
}
