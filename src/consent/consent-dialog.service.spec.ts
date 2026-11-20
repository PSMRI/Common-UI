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
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConsentDialogResult } from './core/consent.models';
import { ConsentDialogComponent } from './consent-dialog/consent-dialog.component';
import { ConsentDialogService } from './consent-dialog.service';
import { PreferenceCentreResult } from './core/ui/preference-centre.base';
import { PreferenceCentreComponent } from './preference-centre/preference-centre.component';

describe('ConsentDialogService (src)', () => {
  let dialog: jasmine.SpyObj<MatDialog>;
  let service: ConsentDialogService;

  beforeEach(() => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: dialog }] });
    service = TestBed.inject(ConsentDialogService);
  });

  it('opens a dialog that cannot be dismissed by backdrop or Esc', () => {
    const result: ConsentDialogResult = {
      outcome: 'GRANTED',
      consentId: 'c-1',
      consentingParty: 'SELF',
      decisions: [],
      syncStatus: 'SYNCED',
    };
    dialog.open.and.returnValue({ afterClosed: () => of(result) } as never);
    const options = { context: 'REGISTRATION' as const, beneficiaryRegId: null };
    let out: ConsentDialogResult | undefined;
    service.open(options).subscribe((r) => (out = r));
    expect(dialog.open).toHaveBeenCalledWith(
      ConsentDialogComponent,
      jasmine.objectContaining({ data: options, disableClose: true, maxHeight: '90vh' })
    );
    expect(out).toBe(result);
  });

  it('maps an empty close to NO_DECISION', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as never);
    let out: ConsentDialogResult | undefined;
    service.open({ context: 'REGISTRATION', beneficiaryRegId: null }).subscribe((r) => (out = r));
    expect(out!.outcome).toBe('NO_DECISION');
  });

  it('opens the preference centre with the patient and does not close on backdrop or Esc', () => {
    dialog.open.and.returnValue({ afterClosed: () => of({ changed: true }) } as never);
    const options = { beneficiaryRegId: 42, patientPhone: '9876543212' };
    let out: PreferenceCentreResult | undefined;
    service.openPreferenceCentre(options).subscribe((r) => (out = r));
    expect(dialog.open).toHaveBeenCalledWith(
      PreferenceCentreComponent,
      jasmine.objectContaining({ data: options, disableClose: true })
    );
    expect(out).toEqual({ changed: true });
  });

  it('reports no change when the preference centre closes empty', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as never);
    let out: PreferenceCentreResult | undefined;
    service.openPreferenceCentre({ beneficiaryRegId: 42 }).subscribe((r) => (out = r));
    expect(out).toEqual({ changed: false });
  });
});
