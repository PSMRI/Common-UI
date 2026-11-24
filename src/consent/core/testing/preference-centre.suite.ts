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

import { InjectionToken, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConsentApiService } from '../consent-api.service';
import { ConsentConfigService } from '../consent-config.service';
import { ConsentContextService } from '../consent-context.service';
import { ConsentCaptureContext } from '../consent.models';
import { PreferenceCentreBase } from '../ui/preference-centre.base';
import { mockConsents, mockNotice, mockOtpChallenge } from './consent.mock';

export interface PreferenceCentreTokens {
  data: InjectionToken<unknown>;
  ref: unknown;
}

/** Behaviour suite run by each track's preference centre spec (AMM-2522). */
export function preferenceCentreSuite(
  PreferenceCentreComponent: Type<PreferenceCentreBase>,
  track: string,
  tokens: PreferenceCentreTokens
): void {
  describe(`PreferenceCentreComponent (${track})`, () => {
    let fixture: ComponentFixture<PreferenceCentreBase>;
    let component: PreferenceCentreBase;
    let api: jasmine.SpyObj<ConsentApiService>;
    let consentConfig: jasmine.SpyObj<ConsentConfigService>;
    let dialogRef: jasmine.SpyObj<{ close: (r: unknown) => void }>;
    let ctx: ConsentCaptureContext;
    const text = {
      prefTitle: 'Consent preferences',
      prefCurrent: 'Current consents',
      doctorAccess: 'Doctor access',
      history: 'History',
      statusGRANTED: 'Granted',
      statusDENIED: 'Denied',
      statusWITHDRAWN: 'Withdrawn',
      statusSUPERSEDED: 'Replaced',
      mandatory: 'Required',
      optional: 'Optional',
      validUntil: 'Valid until',
      notWithdrawable: 'Required by law',
      prefTurnOn: 'Turn on',
      prefTurnOff: 'Turn off',
      prefTurnOnTitle: 'Turn on "{purpose}"',
      prefTurnOffTitle: 'Turn off "{purpose}"',
      withdraw: 'Withdraw',
      withdrawAll: 'Withdraw all',
      withdrawAllTitle: 'Withdraw all consent',
      withdrawAllContactOfficer: 'Contact the grievance officer to withdraw all consent.',
      withdrawContactOfficer: 'Contact the grievance officer to withdraw.',
      prefSelectHint: 'Tick to turn on',
      prefTurnOnSelected: 'Turn on selected ({count})',
      prefTurnOnSelectedTitle: 'Turn on {count} purpose(s)',
      grievanceOfficer: 'Grievance officer',
      grievancePhone: 'Phone',
      close: 'Close',
      prefLoading: 'Loading',
      prefConfirm: 'Confirm',
      prefCancel: 'Cancel',
      prefSaved: 'Saved',
      prefKeptByLaw: 'Kept by law:',
      prefLoadFailed: 'Could not load',
      prefNoConsents: 'No consents',
      prefNoHistory: 'No history',
      staleReload: 'Changed elsewhere',
      otpInvalid: 'Wrong OTP',
      prefNeedsConsent: 'Needs consent',
      serviceUnavailable: 'Unavailable',
      notSynced: 'Not synced',
      modeOtp: 'OTP',
      modeSelfRead: 'Self read',
      modeReadAloud: 'Read aloud',
      sendOtp: 'Send OTP',
    };

    function el(selector: string): HTMLElement | null {
      return fixture.nativeElement.querySelector(selector);
    }

    function all(selector: string): HTMLElement[] {
      return Array.from(fixture.nativeElement.querySelectorAll(selector));
    }

    function purpose(code: string) {
      return component.current.find(p => p.purposeCode === code)!;
    }

    function render(): void {
      fixture.detectChanges();
      fixture.detectChanges();
    }

    beforeEach(() => {
      api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', [
        'getConsents',
        'changePreference',
        'withdraw',
        'sendOtp',
        'verifyOtp',
        'getNotice',
      ]);
      api.getNotice.and.returnValue(
        of({
          ...mockNotice('en'),
          source: 'PROJECT' as const,
          grievance: {
            officerName: 'Ms Rao',
            phone: '1800-000-111',
            email: null,
            address: null,
            officeHours: null,
          },
        })
      );
      consentConfig = jasmine.createSpyObj<ConsentConfigService>('ConsentConfigService', ['load']);
      consentConfig.load.and.returnValue(of({ projectId: 12 } as any));
      api.getConsents.and.returnValue(of(mockConsents()));
      api.changePreference.and.returnValue(of(mockConsents()));
      api.withdraw.and.returnValue(of(mockConsents()));
      api.sendOtp.and.returnValue(of(mockOtpChallenge()));
      dialogRef = jasmine.createSpyObj('DialogRef', ['close']);
      ctx = {
        capturedBy: 4521,
        providerServiceMapId: 1714,
        facilityId: 33,
        servicePointId: 7,
        serviceLine: 'MMU',
        deviceId: 'd-1',
        capturedAt: '2026-11-16T10:00:00+05:30',
      };
      const context = jasmine.createSpyObj<ConsentContextService>(
        'ConsentContextService',
        ['context']
      );
      context.context.and.callFake(() => ctx);
      TestBed.configureTestingModule({
        imports: [PreferenceCentreComponent],
        providers: [
          {
            provide: tokens.data,
            useValue: { beneficiaryRegId: 42, patientPhone: '9876543212' },
          },
          { provide: tokens.ref, useValue: dialogRef },
          { provide: ConsentApiService, useValue: api },
          { provide: ConsentContextService, useValue: context },
          { provide: ConsentConfigService, useValue: consentConfig },
          // The src OTP box uses Material form fields.
          provideNoopAnimations(),
          {
            provide: HttpServiceService,
            useValue: { currentLangugae$: of({ consent: text }) },
          },
        ],
      });
      fixture = TestBed.createComponent(PreferenceCentreComponent);
      component = fixture.componentInstance;
      render();
    });

    it('loads the patient consents on open', () => {
      expect(api.getConsents).toHaveBeenCalledWith(42);
      expect(component.current.length).toBe(3);
    });

    it('has no doctor access tab', () => {
      expect(fixture.nativeElement.textContent).not.toContain('Doctor access');
      expect(el('.pref-grant')).toBeNull();
    });

    it('lists each purpose with its status, validity and required/optional label', () => {
      const rows = all('.pref-purpose');
      expect(rows.length).toBe(3);
      const shr = rows.find(r => r.getAttribute('data-code') === 'P-SHR')!;
      expect(shr.querySelector('.pref-status')!.textContent).toContain(
        'Granted'
      );
      expect(shr.textContent).toContain('Optional');
      expect(shr.querySelector('.pref-valid-until')!.textContent).toContain(
        '13/10/2027'
      );
      const reg = rows.find(r => r.getAttribute('data-code') === 'P-REG')!;
      expect(reg.textContent).toContain('Required');
      expect(reg.querySelector('.pref-valid-until')).toBeNull();
    });

    it('gives a required purpose no switch and no withdraw, and explains why', () => {
      const reg = all('.pref-purpose').find(
        r => r.getAttribute('data-code') === 'P-REG'
      )!;
      expect(reg.querySelector('.pref-switch')).toBeNull();
      expect(reg.querySelector('.pref-withdraw')).toBeNull();
      expect(reg.querySelector('.pref-required-by-law')!.textContent).toContain(
        'Required by law'
      );
      expect(component.canSwitch(purpose('P-REG'))).toBeFalse();
    });

    it('turns one purpose off after confirmation, sending only that purpose and its version', () => {
      component.switchPurpose(purpose('P-SHR'));
      render();
      expect(el('.pref-action')!.textContent).toContain(
        'Turn off "Share with facilities"'
      );
      expect(api.changePreference).not.toHaveBeenCalled();
      (el('.pref-confirm') as HTMLButtonElement).click();
      const [id, req, key] = api.changePreference.calls.mostRecent().args;
      expect(id).toBe(42);
      expect(req).toEqual({
        purposeCodes: ['P-SHR'],
        decision: 'DENY',
        versions: { 'P-SHR': 2 },
        facilityId: 33,
        providerServiceMapId: 1714,
        deviceId: 'd-1',
        serviceLine: 'MMU',
      });
      expect(key).toBeTruthy();
      expect(api.getConsents).toHaveBeenCalledTimes(2);
      expect(component.action).toBeNull();
      expect(component.saved).toBeTrue();
    });

    it('needs a verified OTP before turning a purpose on', () => {
      component.switchPurpose(purpose('P-REM'));
      render();
      expect(component.action!.kind).toBe('GRANT');
      expect(el('app-consent-otp-verify')).not.toBeNull();
      expect((el('.pref-confirm') as HTMLButtonElement).disabled).toBeTrue();
      component.onOtpVerified({ challengeId: 'otp-1' });
      render();
      expect((el('.pref-confirm') as HTMLButtonElement).disabled).toBeFalse();
      component.confirmAction();
      const req = api.changePreference.calls.mostRecent().args[1];
      expect(req.decision).toBe('GRANT');
      expect(req.purposeCodes).toEqual(['P-REM']);
      expect(req.versions).toEqual({ 'P-REM': 3 });
      expect(req.otpChallengeId).toBe('otp-1');
    });

    it('sends the OTP for the patient, with the patient as the reference', () => {
      component.switchPurpose(purpose('P-REM'));
      render();
      (el('button.consent-otp-send') as HTMLButtonElement).click();
      expect(api.sendOtp).toHaveBeenCalledWith(
        { purpose: 'CONSENT', phone: '9876543212', refId: '42' },
        jasmine.any(String)
      );
    });

    it('does nothing when the change is cancelled', () => {
      component.switchPurpose(purpose('P-SHR'));
      render();
      (el('.pref-cancel') as HTMLButtonElement).click();
      render();
      expect(component.action).toBeNull();
      expect(el('.pref-action')).toBeNull();
      expect(api.changePreference).not.toHaveBeenCalled();
    });

    it('does not withdraw one purpose: it shows the grievance officer to contact', () => {
      component.withdrawOne(purpose('P-SHR'));
      render();
      expect(api.withdraw).not.toHaveBeenCalled();
      expect(component.action).toBeNull();
      expect(component.withdrawAllContact!.purposes).toEqual(['Share with facilities']);
      const box = el('.pref-withdraw-all-contact')!;
      expect(box.textContent).toContain('Share with facilities');
      expect(box.textContent).toContain('Contact the grievance officer to withdraw.');
      expect(box.textContent).toContain('Ms Rao');
      (el('.pref-withdraw-all-close') as HTMLButtonElement).click();
      render();
      expect(el('.pref-withdraw-all-contact')).toBeNull();
    });

    it('does not offer withdraw for a purpose that is not granted', () => {
      component.withdrawOne(purpose('P-REM'));
      expect(component.action).toBeNull();
      expect(component.withdrawAllContact).toBeNull();
    });

    describe('turning on several purposes', () => {
      beforeEach(() => {
        const consents = mockConsents();
        consents.current.push({
          purposeCode: 'P-RES', name: 'Research', isMandatory: false, isWithdrawable: true,
          status: 'WITHDRAWN', validUntil: null, versionNo: 5,
        });
        api.getConsents.and.returnValue(of(consents));
        component.load();
        render();
      });

      it('lets only optional purposes that are not on be ticked', () => {
        expect(component.selectable.map(p => p.purposeCode)).toEqual(['P-REM', 'P-RES']);
        component.toggleSelected(purpose('P-SHR'));
        component.toggleSelected(purpose('P-REG'));
        expect(component.selectedCodes).toEqual([]);
      });

      it('turns on every ticked purpose with one OTP and one request', () => {
        component.toggleSelected(purpose('P-RES'));
        component.toggleSelected(purpose('P-REM'));
        component.turnOnSelected();
        render();
        expect(component.action!.kind).toBe('GRANT');
        expect(component.grantPurposes(component.action).map(p => p.purposeCode)).toEqual(['P-REM', 'P-RES']);
        expect(component.confirmEnabled).toBeFalse();
        component.onOtpVerified({ challengeId: 'otp-1' });
        component.confirmAction();
        expect(api.changePreference).toHaveBeenCalledTimes(1);
        const req = api.changePreference.calls.mostRecent().args[1];
        expect(req.decision).toBe('GRANT');
        expect(req.purposeCodes).toEqual(['P-REM', 'P-RES']);
        expect(req.versions).toEqual({ 'P-REM': 3, 'P-RES': 5 });
        expect(req.otpChallengeId).toBe('otp-1');
        expect(component.selectedCodes).toEqual([]);
      });

      it('does nothing when nothing is ticked', () => {
        component.turnOnSelected();
        expect(component.action).toBeNull();
      });

      it('untick removes a purpose, and cancel keeps the ticks', () => {
        component.toggleSelected(purpose('P-REM'));
        component.toggleSelected(purpose('P-RES'));
        component.toggleSelected(purpose('P-REM'));
        expect(component.selectedCodes).toEqual(['P-RES']);
        component.turnOnSelected();
        component.cancelAction();
        expect(component.selectedCodes).toEqual(['P-RES']);
      });
    });

    it('does not withdraw all: it shows the grievance officer to contact', () => {
      component.withdrawAll();
      render();
      expect(api.withdraw).not.toHaveBeenCalled();
      expect(component.action).toBeNull();
      expect(consentConfig.load).toHaveBeenCalledWith('REGISTRATION');
      const [context, lang, projectId] = api.getNotice.calls.mostRecent().args;
      expect([context, projectId]).toEqual(['REGISTRATION', 12]);
      expect(lang).toBe(component.history[0].languageCode);
      const box = el('.pref-withdraw-all-contact')!;
      expect(box.textContent).toContain('Contact the grievance officer');
      expect(box.textContent).toContain('Ms Rao');
      expect(box.textContent).toContain('1800-000-111');
      (el('.pref-withdraw-all-close') as HTMLButtonElement).click();
      render();
      expect(el('.pref-withdraw-all-contact')).toBeNull();
    });

    it('shows no officer of its own when the project has no notice', () => {
      api.getNotice.and.returnValue(of({ ...mockNotice('en'), source: 'CENTRAL' as const }));
      component.withdrawAll();
      render();
      expect(component.withdrawAllContact!.grievance).toBeNull();
      expect(component.withdrawAllContact!.grievanceText).toBe('');
      expect(el('.pref-withdraw-all-contact')!.textContent).toContain('Contact the grievance officer');
      expect(api.withdraw).not.toHaveBeenCalled();
    });

    it('still shows the message when the contact cannot be loaded', () => {
      api.getNotice.and.returnValue(throwError(() => ({ kind: 'NETWORK' })));
      component.withdrawAll();
      render();
      expect(component.withdrawAllContact!.loading).toBeFalse();
      expect(el('.pref-withdraw-all-contact')).not.toBeNull();
    });

    it('reloads and explains when someone changed the consent meanwhile', () => {
      api.changePreference.and.returnValue(
        throwError(() => ({ kind: 'STALE', message: 'STALE_VERSION' }))
      );
      component.switchPurpose(purpose('P-SHR'));
      component.confirmAction();
      render();
      expect(component.error).toBe('staleReload');
      expect(component.action).toBeNull();
      expect(api.getConsents).toHaveBeenCalledTimes(2);
      expect(el('.pref-error')!.textContent).toContain('Changed elsewhere');
    });

    it('asks for a new OTP when the server rejects it', () => {
      api.changePreference.and.returnValue(
        throwError(() => ({ kind: 'FAILED', message: 'OTP_INVALID' }))
      );
      component.switchPurpose(purpose('P-REM'));
      component.onOtpVerified({ challengeId: 'otp-1' });
      component.confirmAction();
      expect(component.error).toBe('otpInvalid');
      expect(component.otpChallengeId).toBeNull();
      expect(component.confirmEnabled).toBeFalse();
    });

    it('points to the consent pop-up when the change needs fresh consent', () => {
      api.changePreference.and.returnValue(
        throwError(() => ({
          kind: 'FAILED',
          message: 'BUSINESS_RULE_VIOLATION',
        }))
      );
      component.switchPurpose(purpose('P-SHR'));
      component.confirmAction();
      expect(component.error).toBe('prefNeedsConsent');
    });

    it('keeps the same request key when a failed change is retried', () => {
      api.changePreference.and.returnValue(
        throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' }))
      );
      component.switchPurpose(purpose('P-SHR'));
      component.confirmAction();
      expect(component.error).toBe('serviceUnavailable');
      api.changePreference.and.returnValue(of(mockConsents()));
      component.confirmAction();
      const keys = api.changePreference.calls.all().map(c => c.args[2]);
      expect(keys[0]).toBe(keys[1]);
    });

    it('shows the history newest first, one row per purpose, with mode and sync state', () => {
      const rows = component.history;
      expect(rows.map(r => r.purposeCode)).toEqual(['P-REM', 'P-SHR', 'P-REG']);
      expect(rows[0].purposeName).toBe('SMS reminders');
      expect(rows[0].syncStatus).toBe('NOT_SYNCED');
      expect(rows[1].modeKey).toBe('modeOtp');
      const items = all('.pref-history-row');
      expect(items.length).toBe(3);
      expect(items[0].querySelector('.pref-not-synced')).not.toBeNull();
      expect(items[1].textContent).toContain('OTP');
    });

    it('shows empty states when the patient has no records', () => {
      api.getConsents.and.returnValue(of({ current: [], history: [] }));
      component.load();
      render();
      expect(el('.pref-no-consents')).not.toBeNull();
      expect(el('.pref-no-history')).not.toBeNull();
      expect(el('.pref-withdraw-all')).toBeNull();
    });

    it('shows an error with retry when the consents cannot be loaded', () => {
      api.getConsents.and.returnValue(
        throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' }))
      );
      component.load();
      render();
      expect(el('.pref-load-failed')!.textContent).toContain('Could not load');
      api.getConsents.and.returnValue(of(mockConsents()));
      (el('.pref-load-failed button') as HTMLButtonElement).click();
      render();
      expect(component.loadFailed).toBeFalse();
    });

    it('leaves out a service line the server would reject', () => {
      ctx = { ...ctx, serviceLine: 'Stop TB' };
      component.switchPurpose(purpose('P-SHR'));
      component.confirmAction();
      expect(
        api.changePreference.calls.mostRecent().args[1].serviceLine
      ).toBeUndefined();
    });

    it('closes with no change, or with a change after a save', () => {
      (el('.pref-close') as HTMLButtonElement).click();
      expect(dialogRef.close).toHaveBeenCalledWith({ changed: false });
      component.switchPurpose(purpose('P-SHR'));
      component.confirmAction();
      component.close();
      expect(dialogRef.close).toHaveBeenCalledWith({ changed: true });
    });
  });
}
