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

// Consent hook in RegistrationComponent (T052). The component is built without its template or
// constructor so only the hook is under test; the existing registration.component.spec.ts is untouched.
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConsentDialogResult } from '../../consent/core/consent.models';
import { ConsentDialogService } from '../../consent/consent-dialog.service';
import { RegistrationComponent } from './registration.component';

describe('RegistrationComponent consent hook (src)', () => {
  const env = environment as { consentManagement?: unknown };
  let original: unknown;
  let component: RegistrationComponent;
  let consentDialog: jasmine.SpyObj<{ open: (o: unknown) => unknown }>;
  let matDialog: jasmine.SpyObj<{ open: (c: unknown, o: unknown) => unknown }>;
  let router: jasmine.SpyObj<{ navigate: (c: unknown[]) => unknown }>;
  let registrarService: jasmine.SpyObj<{ sendConsentStatus: (v: unknown) => void }>;

  function result(outcome: ConsentDialogResult['outcome'], consentId: string | null = 'c-1'): ConsentDialogResult {
    return { outcome, consentId, consentingParty: 'SELF', decisions: [], syncStatus: 'SYNCED' };
  }

  beforeEach(() => {
    original = env.consentManagement;
    consentDialog = jasmine.createSpyObj('ConsentDialogService', ['open']);
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    matDialog.open.and.returnValue({ afterClosed: () => of('1') });
    router = jasmine.createSpyObj('Router', ['navigate']);
    registrarService = jasmine.createSpyObj('RegistrarService', ['sendConsentStatus']);
    const fb = new FormBuilder();
    component = Object.create(RegistrationComponent.prototype) as RegistrationComponent;
    Object.assign(component, {
      consentDialog,
      dialog: matDialog,
      router,
      registrarService,
      patientRevisit: false,
      consentResult: null,
      country: { id: 1, Name: 'India' },
      sessionstorage: { getItem: () => null },
      mainForm: fb.group({
        personalInfoForm: fb.group({}),
        locationInfoForm: fb.group({}),
        otherInfoForm: fb.group({}),
        abhaInfoForm: fb.group({}),
      }),
    });
  });

  afterEach(() => {
    env.consentManagement = original;
  });

  it('injects the consent dialog service and starts with no result', () => {
    spyOn(RegistrationComponent.prototype, 'fetchLanguageResponse');
    spyOn(RegistrationComponent.prototype, 'getRegistrationData');
    spyOn(RegistrationComponent.prototype, 'checkPatientRevisit');
    TestBed.configureTestingModule({ providers: [{ provide: ConsentDialogService, useValue: consentDialog }] });
    const built = TestBed.runInInjectionContext(() => {
      const Ctor = RegistrationComponent as unknown as new (...args: unknown[]) => RegistrationComponent;
      return new Ctor(
        {}, {}, new FormBuilder(), registrarService, {}, {}, {},
        { getItem: () => null }, router, matDialog
      );
    });
    expect(built.consentResult).toBeNull();
    expect((built as unknown as { consentDialog: unknown }).consentDialog).toBe(consentDialog);
  });

  describe('feature off', () => {
    beforeEach(() => delete env.consentManagement);

    it('opens the existing consent pop-up exactly as before', () => {
      component.openConsent();
      expect(matDialog.open).toHaveBeenCalled();
      expect(consentDialog.open).not.toHaveBeenCalled();
      expect(registrarService.sendConsentStatus).toHaveBeenCalledWith('1');
    });

    it('keeps the payload unchanged: consent true, no consentId', () => {
      const form = component.iEMRForm() as { [k: string]: unknown };
      expect(form['beneficiaryConsent']).toBeTrue();
      expect('consentId' in form).toBeFalse();
    });
  });

  describe('feature on', () => {
    beforeEach(() => (env.consentManagement = { enabled: true, apiBase: 'http://api' }));

    it('opens the consent dialog for a new registration', () => {
      consentDialog.open.and.returnValue(of(result('GRANTED')));
      component.openConsent();
      expect(consentDialog.open).toHaveBeenCalledWith({ context: 'REGISTRATION', beneficiaryRegId: null });
      expect(matDialog.open).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.consentResult!.consentId).toBe('c-1');
    });

    it('sends the real outcome and consentId', () => {
      consentDialog.open.and.returnValue(of(result('PARTIAL', 'c-9')));
      component.openConsent();
      const form = component.iEMRForm() as { [k: string]: unknown };
      expect(form['beneficiaryConsent']).toBeTrue();
      expect(form['consentId']).toBe('c-9');
    });

    ['BLOCKED', 'NO_DECISION'].forEach((outcome) => {
      it(`returns to search on ${outcome}`, () => {
        consentDialog.open.and.returnValue(of(result(outcome as ConsentDialogResult['outcome'], null)));
        component.openConsent();
        expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
        const fields = component.consentFields();
        expect(fields).toEqual({ beneficiaryConsent: false, consentId: null });
      });
    });

    it('sends consent false when no dialog result exists', () => {
      expect(component.consentFields()).toEqual({ beneficiaryConsent: false, consentId: null });
    });

    it('opens nothing on revisit', () => {
      (component as unknown as { patientRevisit: boolean }).patientRevisit = true;
      component.openConsent();
      expect(consentDialog.open).not.toHaveBeenCalled();
      expect(matDialog.open).not.toHaveBeenCalled();
    });
  });
});
