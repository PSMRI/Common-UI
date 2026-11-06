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
import { ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { of } from 'rxjs';
import { ConsentDialogResult } from '../../src/consent/core/consent.models';
import { ConsentDialogComponent } from './consent-dialog/consent-dialog.component';
import { ConsentDialogService } from './consent-dialog.service';

describe('ConsentDialogService (v2)', () => {
  let dialog: jasmine.SpyObj<ZardDialogService>;
  let service: ConsentDialogService;

  beforeEach(() => {
    dialog = jasmine.createSpyObj<ZardDialogService>('ZardDialogService', ['create']);
    TestBed.configureTestingModule({ providers: [{ provide: ZardDialogService, useValue: dialog }] });
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
    dialog.create.and.returnValue({ afterClosed: () => of(result) } as never);
    const options = { context: 'REGISTRATION' as const, beneficiaryRegId: null };
    let out: ConsentDialogResult | undefined;
    service.open(options).subscribe((r) => (out = r));
    expect(dialog.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        zContent: ConsentDialogComponent,
        zData: options,
        zMaskClosable: false,
        zClosable: false,
        zHideFooter: true,
        zWidth: 'min(960px, 95vw)',
      })
    );
    expect(out).toBe(result);
  });

  it('maps an empty close to NO_DECISION', () => {
    dialog.create.and.returnValue({ afterClosed: () => of(undefined) } as never);
    let out: ConsentDialogResult | undefined;
    service.open({ context: 'REGISTRATION', beneficiaryRegId: null }).subscribe((r) => (out = r));
    expect(out!.outcome).toBe('NO_DECISION');
    expect(out!.consentId).toBeNull();
  });
});
