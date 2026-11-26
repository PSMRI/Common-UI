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

import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { consentDialogSuite } from '../core/testing/consent-dialog.suite';
import { ConsentDialogComponent } from './consent-dialog.component';

consentDialogSuite(ConsentDialogComponent, 'src', { data: MAT_DIALOG_DATA, ref: MatDialogRef, dialog: MatDialog });

describe('ConsentDialogComponent withdrawal note (src)', () => {
  function withOptions(withdrawal: { since: string | null } | null): ConsentDialogComponent {
    const component = Object.create(ConsentDialogComponent.prototype) as ConsentDialogComponent;
    Object.assign(component, {
      options: { context: 'REVISIT', beneficiaryRegId: 101, withdrawal },
      datePipe: new DatePipe('en-US'),
      currentLanguageSet: {
        consent: {
          consentWithdrawnBanner: 'Withdrew consent on {date}.',
          consentWithdrawnBannerNoDate: 'Withdrew consent earlier.',
        },
      },
    });
    return component;
  }

  it('says when the patient withdrew consent', () => {
    expect(withOptions({ since: '2026-11-20' }).withdrawnMessage).toBe('Withdrew consent on 20/11/2026.');
  });

  it('still says so when the date is not known', () => {
    expect(withOptions({ since: null }).withdrawnMessage).toBe('Withdrew consent earlier.');
  });
});
