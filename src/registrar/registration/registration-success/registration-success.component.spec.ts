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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  RegistrationSuccessComponent,
  RegistrationSuccessData,
} from './registration-success.component';

describe('RegistrationSuccessComponent (src)', () => {
  let fixture: ComponentFixture<RegistrationSuccessComponent>;
  let dialogRef: jasmine.SpyObj<{ close: (r: unknown) => void }>;
  const language = {
    bendetails: { beneficiaryID: 'Beneficiary ID' },
    consent: {
      registeredTitle: 'Patient registered successfully',
      consentIdLabel: 'Consent ID',
      consentStatusLabel: 'Consent',
      consentGRANTED: 'Given for all purposes',
      capturedAtLabel: 'Date and time',
      grievanceTitle: 'For questions or complaints',
      grievanceOfficer: 'Grievance officer',
      grievancePhone: 'Phone',
      consentSaveAfterRegistrationFailed: 'Consent could not be saved',
      retry: 'Retry',
      done: 'Done',
    },
  };

  function create(data: RegistrationSuccessData): HTMLElement {
    dialogRef = jasmine.createSpyObj('DialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [RegistrationSuccessComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: HttpServiceService,
          useValue: { currentLangugae$: of(language) },
        },
      ],
    });
    fixture = TestBed.createComponent(RegistrationSuccessComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows the Beneficiary ID and the consent details', () => {
    const el = create({
      beneficiaryID: '748119959947',
      consentFailed: false,
      consent: {
        consentId: 'CN-1',
        outcome: 'GRANTED',
        capturedAt: '2026-11-18T10:00:00+05:30',
        syncStatus: 'SYNCED',
        grievance: {
          officerName: 'Ms Rao',
          phone: '1800',
          email: null,
          address: null,
          officeHours: null,
        },
        grievanceText: '',
        smsLine: 'Sent by SMS to 98******12',
      },
    });
    expect(el.textContent).toContain('Patient registered successfully');
    expect(el.querySelector('.reg-ben-id')!.textContent).toContain(
      '748119959947'
    );
    expect(el.querySelector('.reg-consent-id')!.textContent).toContain('CN-1');
    expect(el.textContent).toContain('Given for all purposes');
    expect(el.querySelector('.reg-grievance')!.textContent).toContain('Ms Rao');
    expect(el.querySelector('.reg-sms')!.textContent).toContain('98******12');
    expect(el.querySelector('.reg-retry')).toBeNull();
  });

  it('shows only the Beneficiary ID without a consent', () => {
    const el = create({
      beneficiaryID: '748119959947',
      consent: null,
      consentFailed: false,
    });
    expect(el.querySelector('.reg-ben-id')!.textContent).toContain(
      '748119959947'
    );
    expect(el.querySelector('.reg-consent-id')).toBeNull();
    expect(el.querySelector('.reg-grievance')).toBeNull();
    (el.querySelector('.reg-done') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });

  it('says the consent failed and offers a retry', () => {
    const el = create({
      beneficiaryID: '748119959947',
      consent: null,
      consentFailed: true,
    });
    expect(el.querySelector('.reg-consent-failed')!.textContent).toContain(
      'Consent could not be saved'
    );
    (el.querySelector('.reg-retry') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith('retry');
  });
});
