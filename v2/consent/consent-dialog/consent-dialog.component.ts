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
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardDialogRef, Z_MODAL_DATA } from 'Common-UI/v2/ui/dialog';
import { ConsentDialogOptions, ConsentDialogResult } from '../../../src/consent/core/consent.models';
import { ConsentDialogBase } from '../../../src/consent/core/ui/consent-dialog.base';
import { LanguageStepComponent } from './language-step/language-step.component';
import { NoticeStepComponent } from './notice-step/notice-step.component';
import { ProofStepComponent } from './proof-step/proof-step.component';
import { PurposesStepComponent } from './purposes-step/purposes-step.component';

@Component({
  selector: 'app-consent-dialog',
  templateUrl: './consent-dialog.component.html',
  standalone: true,
  imports: [
    NgIcon,
    ZardButtonComponent,
    LanguageStepComponent,
    NoticeStepComponent,
    PurposesStepComponent,
    ProofStepComponent,
  ],
  viewProviders: [provideIcons({ lucideX })],
})
export class ConsentDialogComponent extends ConsentDialogBase {
  constructor(
    @Inject(Z_MODAL_DATA) public options: ConsentDialogOptions,
    private dialogRef: ZardDialogRef<ConsentDialogComponent, ConsentDialogResult>
  ) {
    super();
  }

  protected closeDialog(result: ConsentDialogResult): void {
    this.dialogRef.close(result);
  }
}
