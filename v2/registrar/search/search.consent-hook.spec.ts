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

// Consent hook in SearchComponent (feature 003). The component is built without its template or
// constructor so only the hook is under test; the existing search.component.spec.ts is untouched.
import { of } from 'rxjs';
import { RevisitConsentResult } from '../../consent/revisit-consent.service';
import { SearchComponent } from './search.component';

describe('SearchComponent consent hook (feature 003)', () => {
  let component: SearchComponent;
  let revisitConsent: jasmine.SpyObj<{
    pendingIds: (ids: number[]) => unknown;
    ensureConsent: (p: unknown) => unknown;
  }>;
  let confirmationService: jasmine.SpyObj<{ alert: (m: unknown, s: unknown) => unknown }>;
  let sendToNurse: jasmine.Spy;
  const ben = {
    beneficiaryRegID: '101',
    dob: '1990-01-01T00:00:00',
    benPhoneMaps: [{ phoneNo: '9876543210' }],
  };

  beforeEach(() => {
    revisitConsent = jasmine.createSpyObj('RevisitConsentService', ['pendingIds', 'ensureConsent']);
    confirmationService = jasmine.createSpyObj('ConfirmationService', ['alert']);
    component = Object.create(SearchComponent.prototype) as SearchComponent;
    Object.assign(component, {
      revisitConsent,
      confirmationService,
      changeDetectorRef: { detectChanges: () => undefined },
      currentLanguageSet: { consent: { consentRequiredForVisit: 'Consent is required' } },
      beneficiaryList: [
        { beneficiaryRegID: 101, benObject: ben },
        { beneficiaryRegID: 102, benObject: {} },
      ],
    });
    sendToNurse = spyOn(component, 'sendToNurseWindow');
  });

  function rows(): any[] {
    return (component as any).beneficiaryList;
  }

  it('marks the listed patients whose consent is pending', () => {
    revisitConsent.pendingIds.and.returnValue(of(new Set([101])));
    component.markConsentPending();
    expect(revisitConsent.pendingIds).toHaveBeenCalledWith([101, 102]);
    expect(rows().map((r) => r.consentPending)).toEqual([true, false]);
  });

  it('checks pending consent whenever a result list is shown', () => {
    const mark = spyOn(component, 'markConsentPending');
    spyOn(component, 'loadBeneficiaryImages');
    component.setResults([{ beneficiaryRegID: 103 }]);
    expect(mark).toHaveBeenCalledTimes(1);
  });

  it('takes consent for the patient, then sends them to the nurse', () => {
    const done: RevisitConsentResult = { proceed: true, pending: false };
    revisitConsent.ensureConsent.and.returnValue(of(done));
    rows()[0].consentPending = true;
    component.takeConsentAndSend(ben);
    expect(revisitConsent.ensureConsent).toHaveBeenCalledWith({
      beneficiaryRegId: 101,
      phone: '9876543210',
      dob: '1990-01-01T00:00:00',
    });
    expect(rows()[0].consentPending).toBeFalse();
    expect(sendToNurse).toHaveBeenCalledWith(true, ben);
  });

  it('keeps the patient pending and does not send them when consent is required', () => {
    revisitConsent.ensureConsent.and.returnValue(of({ proceed: false, pending: true }));
    component.takeConsentAndSend(ben);
    expect(rows()[0].consentPending).toBeTrue();
    expect(sendToNurse).not.toHaveBeenCalled();
    expect(confirmationService.alert).toHaveBeenCalledWith('Consent is required', 'warn');
  });

  it('sends the patient when consent may be skipped, still marked pending', () => {
    revisitConsent.ensureConsent.and.returnValue(of({ proceed: true, pending: true }));
    component.takeConsentAndSend(ben);
    expect(rows()[0].consentPending).toBeTrue();
    expect(sendToNurse).toHaveBeenCalled();
  });
});
