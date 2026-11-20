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
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { ConsentDialogService } from '../consent-dialog.service';
import { ConsentButtonComponent } from './consent-button.component';

describe('ConsentButtonComponent (src)', () => {
  let fixture: ComponentFixture<ConsentButtonComponent>;
  let component: ConsentButtonComponent;
  let dialog: jasmine.SpyObj<ConsentDialogService>;
  const env = environment as {
    consentManagement?: { enabled?: boolean; apiBase?: string };
  };
  let saved: typeof env.consentManagement;

  function button(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button.consent-button');
  }

  beforeEach(() => {
    saved = env.consentManagement;
    env.consentManagement = { enabled: true, apiBase: 'http://consent' };
    dialog = jasmine.createSpyObj<ConsentDialogService>(
      'ConsentDialogService',
      ['openPreferenceCentre']
    );
    dialog.openPreferenceCentre.and.returnValue(of({ changed: false }));
    TestBed.configureTestingModule({
      imports: [ConsentButtonComponent],
      providers: [
        { provide: ConsentDialogService, useValue: dialog },
        {
          provide: HttpServiceService,
          useValue: {
            currentLangugae$: of({ consent: { consentButton: 'Consent' } }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(ConsentButtonComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => (env.consentManagement = saved));

  it('shows the Consent button for a known patient', () => {
    component.beneficiaryRegID = '42';
    fixture.detectChanges();
    expect(button()!.textContent).toContain('Consent');
  });

  it('shows nothing without a patient or when consent management is off', () => {
    component.beneficiaryRegID = '';
    fixture.detectChanges();
    expect(button()).toBeNull();
    component.beneficiaryRegID = 42;
    env.consentManagement = { enabled: false };
    fixture.detectChanges();
    expect(button()).toBeNull();
  });

  it('opens the preference centre for the patient with their phone', () => {
    component.beneficiaryRegID = '42';
    component.patientPhone = '9876543212';
    fixture.detectChanges();
    button()!.click();
    expect(dialog.openPreferenceCentre).toHaveBeenCalledWith({
      beneficiaryRegId: 42,
      patientPhone: '9876543212',
    });
  });

  it('tells the host only when something changed', () => {
    const updates: number[] = [];
    component.consentUpdated.subscribe(() => updates.push(1));
    component.beneficiaryRegID = 42;
    fixture.detectChanges();
    button()!.click();
    expect(updates.length).toBe(0);
    dialog.openPreferenceCentre.and.returnValue(of({ changed: true }));
    button()!.click();
    expect(updates.length).toBe(1);
  });
});
