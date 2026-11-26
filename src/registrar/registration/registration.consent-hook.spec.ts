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
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConsentDialogResult, SaveConsentRequest } from '../../consent/core/consent.models';
import { ConsentDialogService } from '../../consent/consent-dialog.service';
import { notConfiguredConfig } from '../../consent/core/consent-config';
import { ConsentConfigUnavailable } from '../../consent/core/consent-config.models';
import { ConsentConfigService } from '../../consent/core/consent-config.service';
import { ConsentApiService } from '../../consent/core/consent-api.service';
import { mockResolvedConfig } from '../../consent/core/testing/consent-config.mock';
import { RegistrationComponent } from './registration.component';
import {
  RegistrationSuccessComponent,
  RegistrationSuccessData,
} from './registration-success/registration-success.component';

describe('RegistrationComponent consent hook (src)', () => {
  const env = environment as { consentManagement?: unknown };
  let original: unknown;
  let component: RegistrationComponent;
  let consentDialog: jasmine.SpyObj<{ open: (o: unknown) => unknown }>;
  let consentConfig: jasmine.SpyObj<{ load: (c: unknown) => unknown }>;
  let matDialog: jasmine.SpyObj<{ open: (c: unknown, o: unknown) => unknown }>;
  let router: jasmine.SpyObj<{ navigate: (c: unknown[]) => unknown }>;
  let registrarService: jasmine.SpyObj<{
    sendConsentStatus: (v: unknown) => void;
    identityQuickSearch: (v: unknown) => unknown;
  }>;
  let consentApi: jasmine.SpyObj<{ saveConsent: (r: unknown, k: string) => unknown }>;
  let confirmation: jasmine.SpyObj<{ alert: (...a: unknown[]) => unknown; confirm: (...a: unknown[]) => unknown }>;

  function result(outcome: ConsentDialogResult['outcome'], consentId: string | null = 'c-1'): ConsentDialogResult {
    return { outcome, consentId, consentingParty: 'SELF', decisions: [], syncStatus: 'SYNCED' };
  }

  beforeEach(() => {
    original = env.consentManagement;
    consentDialog = jasmine.createSpyObj('ConsentDialogService', ['open']);
    consentConfig = jasmine.createSpyObj('ConsentConfigService', ['load']);
    consentConfig.load.and.returnValue(of(mockResolvedConfig('all')));
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    matDialog.open.and.returnValue({ afterClosed: () => of('1') });
    router = jasmine.createSpyObj('Router', ['navigate']);
    registrarService = jasmine.createSpyObj('RegistrarService', ['sendConsentStatus', 'identityQuickSearch']);
    consentApi = jasmine.createSpyObj('ConsentApiService', ['saveConsent']);
    confirmation = jasmine.createSpyObj('ConfirmationService', ['alert', 'confirm']);
    const fb = new FormBuilder();
    component = Object.create(RegistrationComponent.prototype) as RegistrationComponent;
    Object.assign(component, {
      consentDialog,
      consentConfig,
      dialog: matDialog,
      router,
      registrarService,
      consentApi,
      confirmationService: confirmation,
      currentLanguageSet: { consent: { consentIdLabel: 'Consent ID', consentSaveAfterRegistrationFailed: 'Retry?' } },
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
    TestBed.configureTestingModule({
      providers: [
        { provide: ConsentDialogService, useValue: consentDialog },
        { provide: ConsentConfigService, useValue: consentConfig },
        { provide: ConsentApiService, useValue: consentApi },
      ],
    });
    const built = TestBed.runInInjectionContext(() => {
      const Ctor = RegistrationComponent as unknown as new (...args: unknown[]) => RegistrationComponent;
      return new Ctor(
        {}, {}, new FormBuilder(), registrarService, {}, {}, {},
        { getItem: () => null }, router, matDialog
      );
    });
    expect(built.consentResult).toBeNull();
    expect((built as unknown as { consentDialog: unknown }).consentDialog).toBe(consentDialog);
    expect((built as unknown as { consentConfig: unknown }).consentConfig).toBe(consentConfig);
  });

  describe('feature off', () => {
    beforeEach(() => delete env.consentManagement);

    it('opens the existing consent pop-up exactly as before', () => {
      component.openConsent();
      expect(matDialog.open).toHaveBeenCalled();
      expect(consentDialog.open).not.toHaveBeenCalled();
      expect(registrarService.sendConsentStatus).toHaveBeenCalledWith('1');
      expect(consentConfig.load).not.toHaveBeenCalled();
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
      expect(consentConfig.load).toHaveBeenCalledWith('REGISTRATION');
      expect(consentDialog.open).toHaveBeenCalledWith({
        context: 'REGISTRATION',
        beneficiaryRegId: null,
        saveAfterRegistration: true,
        config: mockResolvedConfig('all'),
      });
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

    it('passes the project configuration to the dialog', () => {
      consentConfig.load.and.returnValue(of(mockResolvedConfig('full')));
      consentDialog.open.and.returnValue(of(result('GRANTED')));
      component.openConsent();
      expect(consentDialog.open).toHaveBeenCalledWith({
        context: 'REGISTRATION',
        beneficiaryRegId: null,
        saveAfterRegistration: true,
        config: mockResolvedConfig('full'),
      });
    });

    it('opens the legacy pop-up when the project has consent turned off', () => {
      consentConfig.load.and.returnValue(of(mockResolvedConfig('off')));
      component.openConsent();
      expect(consentDialog.open).not.toHaveBeenCalled();
      expect(matDialog.open).toHaveBeenCalled();
      expect(registrarService.sendConsentStatus).toHaveBeenCalledWith('1');
    });

    it('opens the legacy pop-up when the project has no consent configuration', () => {
      consentConfig.load.and.returnValue(of(notConfiguredConfig('REGISTRATION')));
      component.openConsent();
      expect(consentDialog.open).not.toHaveBeenCalled();
      expect(matDialog.open).toHaveBeenCalled();
    });

    it('opens the dialog without a configuration when it cannot be loaded', () => {
      consentConfig.load.and.returnValue(throwError(() => new ConsentConfigUnavailable()));
      consentDialog.open.and.returnValue(of(result('NO_DECISION', null)));
      component.openConsent();
      expect(consentDialog.open).toHaveBeenCalledWith({
        context: 'REGISTRATION',
        beneficiaryRegId: null,
        saveAfterRegistration: true,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('stays on registration when consent is not mandatory for the project', () => {
      const optional = mockResolvedConfig('full');
      consentConfig.load.and.returnValue(of({ ...optional, config: { ...optional.config, mandatory: false } }));
      consentDialog.open.and.returnValue(of(result('NO_DECISION', null)));
      component.openConsent();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.consentFields()).toEqual({ beneficiaryConsent: false, consentId: null });
    });

    it('opens nothing on revisit', () => {
      (component as unknown as { patientRevisit: boolean }).patientRevisit = true;
      component.openConsent();
      expect(consentDialog.open).not.toHaveBeenCalled();
      expect(matDialog.open).not.toHaveBeenCalled();
      expect(consentConfig.load).not.toHaveBeenCalled();
    });
  });

  describe('after registration', () => {
    const request = {
      beneficiaryRegId: null,
      capturedAt: '2026-11-18T10:00:00+05:30',
      decisions: [{ purposeCode: 'P-REG', decision: 'GRANT' }],
      notify: null,
    } as unknown as SaveConsentRequest;
    const grievance = { officerName: 'Grievance Officer', phone: '1800', email: null, address: null, officeHours: null };

    function pending(): ConsentDialogResult {
      return {
        ...{ outcome: 'GRANTED', consentId: null, consentingParty: 'SELF', decisions: [], syncStatus: null },
        pendingSave: { request, idempotencyKey: 'k-1', grievanceText: 'Call 1800', grievance },
      } as ConsentDialogResult;
    }

    function shown(): RegistrationSuccessData {
      const [content, options] = matDialog.open.calls.mostRecent().args as [unknown, { data: RegistrationSuccessData }];
      expect(content).toBe(RegistrationSuccessComponent);
      return options.data;
    }

    let closeWith: unknown;

    beforeEach(() => {
      closeWith = undefined;
      matDialog.open.and.callFake(() => ({ afterClosed: () => of(closeWith) }));
      registrarService.identityQuickSearch.and.returnValue(of({ data: [{ beneficiaryRegID: 9876 }] }));
      consentApi.saveConsent.and.returnValue(
        of({ consentId: 'CN-1', syncStatus: 'SYNCED', purposes: [], notification: { status: 'SENT', maskedPhone: '98******12' } })
      );
      (component as unknown as { currentLanguageSet: unknown }).currentLanguageSet = {
        consent: { smsSent: 'Sent by SMS to {phone}', smsNoPhone: 'No phone' },
      };
    });

    it('finds the patient when quick search answers with a plain list (HWC/TM quickSearchNew)', () => {
      registrarService.identityQuickSearch.and.returnValue(
        of([{ beneficiaryID: '111', beneficiaryRegID: 1 }, { beneficiaryID: '748119959947', beneficiaryRegID: 5432 }])
      );
      component.consentResult = pending();
      component.finishRegistration('748119959947', '9876543212');
      const [sent] = consentApi.saveConsent.calls.mostRecent().args as [SaveConsentRequest, string];
      expect(sent.beneficiaryRegId).toBe(5432);
      expect(shown().consentFailed).toBeFalse();
    });

    it('saves the consent with the beneficiaryRegId and shows one message with both IDs', () => {
      component.consentResult = pending();
      component.finishRegistration('748119959947', '9876543212');
      expect(registrarService.identityQuickSearch).toHaveBeenCalledWith(
        jasmine.objectContaining({ beneficiaryID: '748119959947' })
      );
      const [sent, key] = consentApi.saveConsent.calls.mostRecent().args as [SaveConsentRequest, string];
      expect(sent.beneficiaryRegId).toBe(9876);
      expect(sent.notify).toEqual({ channel: 'SMS', phone: '9876543212' });
      expect(sent.decisions).toEqual(request.decisions);
      expect(key).toBe('k-1');
      expect(matDialog.open).toHaveBeenCalledTimes(1);
      expect(confirmation.alert).not.toHaveBeenCalled();
      const data = shown();
      expect(data.beneficiaryID).toBe('748119959947');
      expect(data.consentFailed).toBeFalse();
      expect(data.consent).toEqual({
        consentId: 'CN-1',
        outcome: 'GRANTED',
        capturedAt: '2026-11-18T10:00:00+05:30',
        syncStatus: 'SYNCED',
        grievance,
        grievanceText: 'Call 1800',
        smsLine: 'Sent by SMS to 98******12',
      });
    });

    it('uses the beneficiaryRegId from the registration response without looking the patient up', () => {
      component.consentResult = pending();
      component.finishRegistration('739136630684', null, 10699347);
      expect(registrarService.identityQuickSearch).not.toHaveBeenCalled();
      const [sent] = consentApi.saveConsent.calls.mostRecent().args as [SaveConsentRequest, string];
      expect(sent.beneficiaryRegId).toBe(10699347);
      expect(shown().beneficiaryID).toBe('739136630684');
      expect(shown().consentFailed).toBeFalse();
    });

    it('shows only the Beneficiary ID when no consent was taken', () => {
      component.consentResult = null;
      component.finishRegistration('748119959947', null);
      expect(consentApi.saveConsent).not.toHaveBeenCalled();
      expect(shown()).toEqual({ beneficiaryID: '748119959947', consent: null, consentFailed: false });
    });

    it('saves only once', () => {
      component.consentResult = pending();
      component.finishRegistration('748119959947', null);
      component.finishRegistration('748119959947', null);
      expect(consentApi.saveConsent).toHaveBeenCalledTimes(1);
    });

    it('says the consent failed, and retries with the same key when staff ask', () => {
      let calls = 0;
      registrarService.identityQuickSearch.and.callFake(() =>
        ++calls === 1 ? of({ data: [] }) : of({ data: [{ beneficiaryRegID: 9876 }] })
      );
      closeWith = 'retry';
      component.consentResult = pending();
      matDialog.open.and.callFake(() => {
        const result = closeWith;
        closeWith = undefined; // the second message is closed with Done
        return { afterClosed: () => of(result) };
      });
      component.finishRegistration('748119959947', null);
      const first = matDialog.open.calls.first().args[1] as { data: RegistrationSuccessData };
      expect(first.data).toEqual({ beneficiaryID: '748119959947', consent: null, consentFailed: true });
      expect(consentApi.saveConsent).toHaveBeenCalledTimes(1);
      expect(consentApi.saveConsent.calls.mostRecent().args[1]).toBe('k-1');
      expect(shown().consent!.consentId).toBe('CN-1');
    });

    it('saves nothing more when staff close the failure message', () => {
      consentApi.saveConsent.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
      component.consentResult = pending();
      component.finishRegistration('748119959947', null);
      expect(shown().consentFailed).toBeTrue();
      expect(consentApi.saveConsent).toHaveBeenCalledTimes(1);
      expect(component.consentResult!.consentId).toBeNull();
    });

    it('tells the patient to note the Consent ID when there is no phone', () => {
      consentApi.saveConsent.and.returnValue(of({ consentId: 'CN-2', syncStatus: 'SYNCED', purposes: [] }));
      component.consentResult = pending();
      component.finishRegistration('748119959947', null);
      expect(shown().consent!.smsLine).toBe('No phone');
    });
  });
});
