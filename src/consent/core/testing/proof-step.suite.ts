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
import { ACTIVE_CONSENT_MODES, CONSENT_MODES, ProofStepBase } from '../ui/proof-step.base';

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

  it('offers the five active consent modes (feature 003)', () => {
    const boxes = fixture.nativeElement.querySelectorAll('.consent-modes input[type="checkbox"]');
    expect(boxes.length).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Patient read it');
  });

  it('emits the mode and an empty proof for self-read', () => {
    const modes: (ConsentMode | null)[] = [];
    const proofs: ProofDraft[] = [];
    component.modeChange.subscribe((m) => modes.push(m));
    component.proofChange.subscribe((p) => proofs.push(p));
    (fixture.nativeElement.querySelector('.consent-modes input[type="checkbox"]') as HTMLInputElement).click();
    expect(modes).toEqual(['SELF_READ']);
    expect(proofs).toEqual([{}]);
  });

  it('ticks only the chosen mode and unticking it clears the mode', () => {
    const modes: (ConsentMode | null)[] = [];
    component.modeChange.subscribe((m) => modes.push(m));
    component.mode = 'OTP';
    fixture.detectChanges();
    const boxes: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.consent-modes input[type="checkbox"]'),
    );
    expect(boxes.filter((b) => b.checked).length).toBe(1);
    expect(boxes[4].checked).toBeTrue();
    component.toggleMode('SELF_READ', false);
    expect(modes).toEqual([]);
    component.toggleMode('OTP', false);
    expect(modes).toEqual([null]);
  });

  describe('configured modes (feature 002)', () => {
    function labels(): string[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('.consent-modes [data-consent-mode]') as NodeListOf<HTMLElement>
      ).map((e) => (e.textContent || '').trim());
    }

    it('shows only the configured modes in the configured order', () => {
      component.modes = [CONSENT_MODES[5], CONSENT_MODES[0]];
      fixture.detectChanges();
      expect(labels()).toEqual(['OTP', 'Patient read it']);
    });

    it('hides the mode choice and shows the proof when one mode is allowed', () => {
      component.modes = [CONSENT_MODES[3]];
      component.mode = 'WITNESSED';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.consent-modes')).toBeNull();
      expect(fixture.nativeElement.querySelector('input[name="consent-witness-name"]')).not.toBeNull();
    });

    it('offers the active modes by default', () => {
      expect(component.modes).toEqual(ACTIVE_CONSENT_MODES);
    });
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

    it('shows no declaration before a mode is chosen', () => {
      component.declaration = 'I agree';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.consent-declaration')).toBeNull();
    });

    it('self-read: tick the declaration and record or upload the agreement', () => {
      component.declaration = 'I agree to it';
      component.languageCode = 'hi';
      component.text = { ...component.text, recordAgreementButton: 'Start recording', uploadRecording: 'Upload a recording' };
      show('SELF_READ');
      const box = fixture.nativeElement.querySelector('.consent-declaration') as HTMLElement;
      expect(box.textContent).toContain('I agree to it');
      expect(box.getAttribute('lang')).toBe('hi');
      const recorder = child<{ minSeconds: number; maxSeconds: number; recordLabel: string; uploadLabel: string; captured: { emit: (v: unknown) => void } }>(
        'app-consent-media-capture'
      );
      expect(recorder.minSeconds).toBe(2);
      expect(recorder.maxSeconds).toBe(60);
      expect(recorder.recordLabel).toBe('Start recording');
      expect(recorder.uploadLabel).toBe('Upload a recording');
      expect(fixture.nativeElement.querySelector('.consent-media-upload').textContent).toContain('Upload a recording');
      (fixture.nativeElement.querySelector('.consent-declaration-agree input[type="checkbox"]') as HTMLInputElement).click();
      expect(proofs[proofs.length - 1]).toEqual({ declarationAgreed: true });
      recorder.captured.emit({ blob, durationSec: 5 });
      expect(proofs[proofs.length - 1]).toEqual({ declarationAgreed: true, voiceClip: blob, voiceDurationSec: 5 });
      component.setDeclarationAgreed(false);
      expect(proofs[proofs.length - 1]).toEqual({ declarationAgreed: false, voiceClip: blob, voiceDurationSec: 5 });
    });

    it('passes the server upload state to the recorder and its request up', () => {
      const requested = jasmine.createSpy('uploadRecording');
      component.uploadRecording.subscribe(requested);
      component.recordingUpload = 'UPLOADING';
      show('SELF_READ');
      const recorder = child<{ serverUpload: boolean; uploadState: string; uploadRequested: { emit: () => void } }>(
        'app-consent-media-capture'
      );
      expect(recorder.serverUpload).toBeTrue();
      expect(recorder.uploadState).toBe('UPLOADING');
      recorder.uploadRequested.emit();
      expect(requested).toHaveBeenCalledTimes(1);
      show('READ_ALOUD');
      child<{ uploadRequested: { emit: () => void } }>('app-consent-media-capture').uploadRequested.emit();
      expect(requested).toHaveBeenCalledTimes(2);
    });

    describe('read aloud (feature 003)', () => {
      let spoken: SpeechSynthesisUtterance[];

      beforeEach(() => {
        spoken = [];
        spyOn(window.speechSynthesis, 'speak').and.callFake((u: SpeechSynthesisUtterance) => spoken.push(u));
        spyOn(window.speechSynthesis, 'cancel');
        component.declaration = 'I agree';
        component.languageCode = 'hi';
      });

      function finish(index: number, completed: boolean): void {
        const u = spoken[index] as unknown as { onend: () => void; onerror: () => void };
        if (completed) {
          u.onend();
        } else {
          u.onerror();
        }
        fixture.detectChanges();
      }

      it('shows the steps, records the conversation and takes the patient\'s answer', () => {
        component.text = { ...component.text, readAloudStepRead: 'Read it', readAloudStepAsk: 'Ask', readAloudStepAnswer: 'Tap' };
        show('READ_ALOUD');
        expect(fixture.nativeElement.querySelectorAll('.consent-read-aloud-steps li').length).toBe(3);
        const recorder = child<{ minSeconds: number; maxSeconds: number; captured: { emit: (v: unknown) => void } }>(
          'app-consent-media-capture'
        );
        expect(recorder.minSeconds).toBe(2);
        expect(recorder.maxSeconds).toBe(120);
        recorder.captured.emit({ blob, durationSec: 90 });
        const yes = fixture.nativeElement.querySelector('.consent-declaration-yes') as HTMLButtonElement;
        expect(yes.getAttribute('aria-pressed')).toBe('false');
        yes.click();
        fixture.detectChanges();
        expect(yes.getAttribute('aria-pressed')).toBe('true');
        expect(proofs[proofs.length - 1]).toEqual({ voiceClip: blob, voiceDurationSec: 90, declarationAgreed: true });
      });

      it('plays the declaration with the device voice when staff want it (optional)', () => {
        show('READ_ALOUD');
        (fixture.nativeElement.querySelector('.consent-declaration-play') as HTMLButtonElement).click();
        expect(spoken.length).toBe(1);
        expect(spoken[0].text).toBe('I agree');
        expect(spoken[0].lang).toBe('hi-IN');
        expect(component.speaking).toBeTrue();
        finish(0, true);
        expect(component.speaking).toBeFalse();
        expect(proofs[proofs.length - 1]).toEqual({ declarationPlayed: true });
      });

      it('a No asks to decline and keeps the recording', () => {
        const refused = jasmine.createSpy('refused');
        component.declarationRefused.subscribe(refused);
        show('READ_ALOUD');
        component.answerDeclaration(true);
        component.onVoice({ blob, durationSec: 4 });
        (fixture.nativeElement.querySelector('.consent-declaration-no') as HTMLButtonElement).click();
        expect(refused).toHaveBeenCalledTimes(1);
        expect(proofs[proofs.length - 1]).toEqual({ declarationAgreed: false, voiceClip: blob, voiceDurationSec: 4 });
      });

      it('stop cancels speech and ignores its late end', () => {
        show('READ_ALOUD');
        component.playDeclaration();
        component.stopDeclaration();
        expect(component.speaking).toBeFalse();
        expect(window.speechSynthesis.cancel).toHaveBeenCalled();
        finish(0, true);
        expect(proofs.some((p) => p.declarationPlayed)).toBeFalse();
        component.stopDeclaration();
      });

      it('a speech error does not count as played', () => {
        show('READ_ALOUD');
        component.playDeclaration();
        finish(0, false);
        expect(component.speaking).toBeFalse();
        expect(proofs.some((p) => p.declarationPlayed)).toBeFalse();
      });

      it('plays configured audio and counts its end; a broken file falls back to the voice', () => {
        component.declarationAudioUrl = 'https://example.org/decl.mp3';
        show('READ_ALOUD');
        const audio = fixture.nativeElement.querySelector('.consent-declaration-audio') as HTMLAudioElement;
        expect(fixture.nativeElement.querySelector('.consent-declaration-play')).toBeNull();
        audio.dispatchEvent(new Event('ended'));
        expect(proofs[proofs.length - 1]).toEqual({ declarationPlayed: true });
        audio.dispatchEvent(new Event('error'));
        fixture.detectChanges();
        expect(component.audioFailed).toBeTrue();
        expect(fixture.nativeElement.querySelector('.consent-declaration-audio')).toBeNull();
        expect(fixture.nativeElement.querySelector('.consent-declaration-play')).not.toBeNull();
      });

      it('without audio or a device voice there is no play button; staff read it', () => {
        spyOn(component, 'speechAvailable').and.returnValue(false);
        show('READ_ALOUD');
        expect(fixture.nativeElement.querySelector('.consent-declaration-play')).toBeNull();
        component.playDeclaration();
        expect(spoken.length).toBe(0);
        expect(fixture.nativeElement.querySelector('app-consent-media-capture')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.consent-declaration-yes')).not.toBeNull();
      });

      it('a mode change or closing stops speech', () => {
        show('READ_ALOUD');
        component.playDeclaration();
        component.selectMode('OTP');
        expect(component.speaking).toBeFalse();
        component.playDeclaration();
        component.ngOnDestroy();
        expect(component.speaking).toBeFalse();
      });
    });

    it('Guardian / Representative takes name, relationship and the agreement', () => {
      component.text = { ...component.text, representativeAgree: 'Representative agrees' };
      show('WITNESSED');
      const name = fixture.nativeElement.querySelector('input[name="consent-witness-name"]') as HTMLInputElement;
      const rel = fixture.nativeElement.querySelector('input[name="consent-witness-relationship"]') as HTMLInputElement;
      name.value = 'Ravi';
      name.dispatchEvent(new Event('input'));
      rel.value = 'Neighbour';
      rel.dispatchEvent(new Event('input'));
      expect(proofs[proofs.length - 1]).toEqual({ witnessName: 'Ravi', witnessRelationship: 'Neighbour' });
      const agree = fixture.nativeElement.querySelector('.consent-declaration-agree') as HTMLElement;
      expect(agree.textContent).toContain('Representative agrees');
      (agree.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
      expect(proofs[proofs.length - 1]).toEqual({ witnessName: 'Ravi', witnessRelationship: 'Neighbour', declarationAgreed: true });
    });

    it('signature mode takes only the signed form photo, no face photo (feature 003)', () => {
      component.text = { ...component.text, signedFormPhoto: 'Signed form' };
      show('SIGNATURE_PHOTO');
      const captures = fixture.debugElement.queryAll(By.css('app-consent-media-capture'));
      expect(captures.length).toBe(1);
      const form = captures[0].componentInstance as { kind: string; label: string; captured: { emit: (v: unknown) => void } };
      expect(form.kind).toBe('photo');
      expect(form.label).toBe('Signed form');
      form.captured.emit({ blob, durationSec: null });
      expect(proofs[proofs.length - 1]).toEqual({ signedFormPhoto: blob });
      component.onPhoto('signedFormPhoto', null);
      expect(proofs[proofs.length - 1]).toEqual({ signedFormPhoto: null });
    });

    it('never shows voice-clip capture (feature 003)', () => {
      show('VOICE_CLIP');
      expect(fixture.nativeElement.querySelectorAll('app-consent-media-capture').length).toBe(0);
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
