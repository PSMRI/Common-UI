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
import { By } from '@angular/platform-browser';
import { CameraService } from 'src/app/app-modules/core/services';
import { ConsentApiService } from '../consent-api.service';
import { ConsentMode, ProofDraft } from '../consent.models';
import { Type } from '@angular/core';
import { ProofStepBase } from '../ui/proof-step.base';

/** Behaviour suite run by each track's proof step spec. */
export function proofStepSuite(ProofStepComponent: Type<ProofStepBase>, track: string): void {
describe(`ProofStepComponent (${track})`, () => {
  let fixture: ComponentFixture<ProofStepBase>;
  let component: ProofStepBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProofStepComponent],
      providers: [
        { provide: ConsentApiService, useValue: jasmine.createSpyObj('ConsentApiService', ['sendOtp', 'verifyOtp']) },
        { provide: CameraService, useValue: jasmine.createSpyObj('CameraService', ['capture']) },
      ],
    });
    fixture = TestBed.createComponent(ProofStepComponent);
    component = fixture.componentInstance;
    component.text = { mode: 'How?', modeSelfRead: 'Patient read it', modeOtp: 'OTP' };
    fixture.detectChanges();
  });

  it('offers all six consent modes', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Patient read it');
  });

  it('emits the mode and an empty proof for self-read', () => {
    const modes: ConsentMode[] = [];
    const proofs: ProofDraft[] = [];
    component.modeChange.subscribe((m) => modes.push(m));
    component.proofChange.subscribe((p) => proofs.push(p));
    (fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement).click();
    expect(modes).toEqual(['SELF_READ']);
    expect(proofs).toEqual([{}]);
  });

  describe('per mode', () => {
    let proofs: ProofDraft[];
    const blob = new Blob(['x']);

    function show(mode: ConsentMode): void {
      component.mode = mode;
      fixture.detectChanges();
    }

    function child<T>(selector: string, index = 0): T {
      return fixture.debugElement.queryAll(By.css(selector))[index].componentInstance as T;
    }

    beforeEach(() => {
      proofs = [];
      component.proofChange.subscribe((p) => proofs.push(p));
    });

    it('self-read shows no extra input', () => {
      show('SELF_READ');
      expect(fixture.nativeElement.querySelectorAll('app-consent-media-capture, app-consent-otp-verify').length).toBe(0);
    });

    it('read aloud records the worker confirmation', () => {
      show('READ_ALOUD');
      (fixture.nativeElement.querySelector('fieldset input[type="checkbox"]') as HTMLInputElement).click();
      expect(proofs[proofs.length - 1]).toEqual({ workerConfirmed: true });
      component.setWorkerConfirmed(false);
      expect(proofs[proofs.length - 1]).toEqual({ workerConfirmed: false });
    });

    it('voice clip takes the recorded blob and duration', () => {
      show('VOICE_CLIP');
      expect(fixture.nativeElement.querySelectorAll('app-consent-media-capture').length).toBe(1);
      child<{ captured: { emit: (v: unknown) => void } }>('app-consent-media-capture').captured.emit({ blob, durationSec: 45 });
      expect(proofs[proofs.length - 1]).toEqual({ voiceClip: blob, voiceDurationSec: 45 });
      component.onVoice(null);
      expect(proofs[proofs.length - 1]).toEqual({ voiceClip: null, voiceDurationSec: null });
    });

    it('witnessed takes name and relationship', () => {
      show('WITNESSED');
      const name = fixture.nativeElement.querySelector('input[name="consent-witness-name"]') as HTMLInputElement;
      const rel = fixture.nativeElement.querySelector('input[name="consent-witness-relationship"]') as HTMLInputElement;
      name.value = 'Ravi';
      name.dispatchEvent(new Event('input'));
      rel.value = 'Neighbour';
      rel.dispatchEvent(new Event('input'));
      expect(proofs[proofs.length - 1]).toEqual({ witnessName: 'Ravi', witnessRelationship: 'Neighbour' });
    });

    it('signature/thumb needs a patient photo and a signed form photo', () => {
      show('SIGNATURE_PHOTO');
      expect(fixture.nativeElement.querySelectorAll('app-consent-media-capture').length).toBe(2);
      child<{ captured: { emit: (v: unknown) => void } }>('app-consent-media-capture', 0).captured.emit({ blob, durationSec: null });
      child<{ captured: { emit: (v: unknown) => void } }>('app-consent-media-capture', 1).captured.emit({ blob, durationSec: null });
      expect(proofs[proofs.length - 1]).toEqual({ patientPhoto: blob, signedFormPhoto: blob });
      component.onPhoto('patientPhoto', null);
      expect(proofs[proofs.length - 1]).toEqual({ patientPhoto: null, signedFormPhoto: blob });
    });

    it('OTP passes the patient phone and records the verified challenge', () => {
      component.patientPhone = '9876543212';
      show('OTP');
      const otp = child<{ phoneNumber: string; verified: { emit: (v: unknown) => void } }>('app-consent-otp-verify');
      expect(otp.phoneNumber).toBe('9876543212');
      otp.verified.emit({ challengeId: 'otp-1', phone: '9876543212' });
      expect(proofs[proofs.length - 1]).toEqual({ otpChallengeId: 'otp-1', otpVerified: true });
    });

    it('a mode change clears the previous proof', () => {
      component.setWitness('witnessName', 'Ravi');
      component.selectMode('OTP');
      expect(component.proof).toEqual({});
      expect(proofs[proofs.length - 1]).toEqual({});
    });
  });
});
}
