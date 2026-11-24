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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConsentApiService } from '../core/consent-api.service';
import { ConsentConfigService } from '../core/consent-config.service';
import { ConsentContextService } from '../core/consent-context.service';
import { mockConsents, mockNotice } from '../core/testing/consent.mock';
import { preferenceCentreSuite } from '../core/testing/preference-centre.suite';
import { PreferenceCentreComponent } from './preference-centre.component';

preferenceCentreSuite(PreferenceCentreComponent, 'src', { data: MAT_DIALOG_DATA, ref: MatDialogRef });

describe('PreferenceCentreComponent (src screen)', () => {
  let fixture: ComponentFixture<PreferenceCentreComponent>;
  let component: PreferenceCentreComponent;
  let api: jasmine.SpyObj<ConsentApiService>;
  const text = {
    prefCurrent: 'Current consents',
    history: 'History',
    prefTurnOn: 'Turn on',
    prefTurnOff: 'Turn off',
    withdraw: 'Withdraw',
    withdrawAll: 'Withdraw all',
    prefSelectHint: 'Tick to turn on',
    prefTurnOnSelected: 'Turn on selected ({count})',
    prefTurnOnSelectedTitle: 'Turn on {count} purpose(s)',
    withdrawContactOfficer: 'Contact the grievance officer to withdraw.',
    close: 'Close',
  };

  function el(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  function row(code: string): HTMLElement {
    return fixture.nativeElement.querySelector(`.pref-purpose[data-code="${code}"]`);
  }

  function render(): void {
    fixture.detectChanges();
    fixture.detectChanges();
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', [
      'getConsents', 'changePreference', 'withdraw', 'sendOtp', 'verifyOtp', 'getNotice',
    ]);
    const consents = mockConsents();
    consents.current.push({
      purposeCode: 'P-RES', name: 'Research', isMandatory: false, isWithdrawable: true,
      status: 'DENIED', validUntil: null, versionNo: 5,
    });
    api.getConsents.and.returnValue(of(consents));
    api.changePreference.and.returnValue(of(mockConsents()));
    api.getNotice.and.returnValue(of({ ...mockNotice('en'), source: 'PROJECT' as const }));
    const consentConfig = jasmine.createSpyObj<ConsentConfigService>('ConsentConfigService', ['load']);
    consentConfig.load.and.returnValue(of({ projectId: 12 } as any));
    const context = jasmine.createSpyObj<ConsentContextService>('ConsentContextService', ['context']);
    context.context.and.returnValue({
      capturedBy: 1, providerServiceMapId: 1714, facilityId: 33, servicePointId: 7,
      serviceLine: 'TM', deviceId: 'd-1', capturedAt: '2026-11-24T10:00:00+05:30',
    });
    TestBed.configureTestingModule({
      imports: [PreferenceCentreComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { beneficiaryRegId: 42, patientPhone: '9876543212' } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('DialogRef', ['close']) },
        { provide: ConsentApiService, useValue: api },
        { provide: ConsentContextService, useValue: context },
        { provide: ConsentConfigService, useValue: consentConfig },
        provideNoopAnimations(),
        { provide: HttpServiceService, useValue: { currentLangugae$: of({ consent: text }) } },
      ],
    });
    fixture = TestBed.createComponent(PreferenceCentreComponent);
    component = fixture.componentInstance;
    render();
  });

  it('shows current consents and history on separate tabs', () => {
    const current = el('.pref-panel-current')!;
    const history = el('.pref-panel-history')!;
    expect(el('.pref-tab-current')!.classList).toContain('pref-tab-active');
    expect(current.hidden).toBeFalse();
    expect(history.hidden).toBeTrue();
    (el('.pref-tab-history') as HTMLButtonElement).click();
    render();
    expect(current.hidden).toBeTrue();
    expect(history.hidden).toBeFalse();
    expect(el('.pref-tab-history')!.getAttribute('aria-selected')).toBe('true');
  });

  it('gives a tick box only to optional purposes that are not on, and no turn on/off buttons', () => {
    expect(row('P-REM').querySelector('.pref-select')).not.toBeNull();
    expect(row('P-RES').querySelector('.pref-select')).not.toBeNull();
    expect(row('P-SHR').querySelector('.pref-select')).toBeNull();
    expect(row('P-REG').querySelector('.pref-select')).toBeNull();
    expect(el('.pref-switch')).toBeNull();
  });

  it('turns on the ticked purposes from one button, asking for one OTP', () => {
    const button = el('.pref-turn-on-selected') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    (row('P-REM').querySelector('.pref-select') as HTMLInputElement).click();
    (row('P-RES').querySelector('.pref-select') as HTMLInputElement).click();
    render();
    expect(button.textContent).toContain('Turn on selected (2)');
    expect(button.disabled).toBeFalse();
    button.click();
    render();
    expect(el('.pref-action')!.textContent).toContain('Turn on 2 purpose(s)');
    expect(el('.pref-grant-list')!.textContent).toContain('SMS reminders');
    expect(el('.pref-grant-list')!.textContent).toContain('Research');
    expect(fixture.nativeElement.querySelectorAll('app-consent-otp-verify').length).toBe(1);
    expect(el('.pref-turn-on-selected')).toBeNull();
  });

  it('shows the grievance officer as a pop-up when Withdraw is clicked', () => {
    (row('P-SHR').querySelector('.pref-withdraw') as HTMLButtonElement).click();
    render();
    expect(api.withdraw).not.toHaveBeenCalled();
    const popup = el('.pref-modal-backdrop .pref-withdraw-all-contact')!;
    expect(popup.getAttribute('role')).toBe('alertdialog');
    expect(popup.textContent).toContain('Contact the grievance officer to withdraw.');
    expect(component.action).toBeNull();
  });
});
