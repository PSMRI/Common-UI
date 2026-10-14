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

import { Type } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { CameraService } from 'src/app/app-modules/core/services';
import { CapturedMedia, MediaCaptureBase, dataUrlToBlob } from '../ui/media-capture.base';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

class FakeRecorder {
  static last: FakeRecorder;
  mimeType = 'audio/ogg';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown) {
    FakeRecorder.last = this;
  }
  start(): void {}
  stop(): void {
    this.ondataavailable!({ data: new Blob(['a']) });
    this.onstop!();
  }
}

class FakeAudio {
  static duration = 40;
  duration = FakeAudio.duration;
  onloadedmetadata: (() => void) | null = null;
  set src(_v: string) {
    setTimeout(() => this.onloadedmetadata!());
  }
}

/** Behaviour suite run by each track's media capture spec. */
export function mediaCaptureSuite(MediaCaptureComponent: Type<MediaCaptureBase>, track: string): void {
  describe(`MediaCaptureComponent (${track})`, () => {
    let fixture: ComponentFixture<MediaCaptureBase>;
    let component: MediaCaptureBase;
    let camera: jasmine.SpyObj<{ capture: () => unknown }>;
    let emitted: (CapturedMedia | null)[];
    let track$: jasmine.Spy;
    let realRecorder: unknown;
    let realAudio: unknown;

    function create(kind: 'photo' | 'voice'): void {
      fixture = TestBed.createComponent(MediaCaptureComponent);
      component = fixture.componentInstance;
      component.kind = kind;
      component.label = 'Proof';
      component.text = {
        takePhoto: 'Take photo',
        recordVoice: 'Record',
        stopRecording: 'Stop',
        upload: 'Upload instead',
        retake: 'Retake',
        voiceTooShort: 'Too short',
        voiceTooLong: 'Too long',
      };
      emitted = [];
      component.captured.subscribe((m) => emitted.push(m));
      fixture.detectChanges();
    }

    function fileInput(file: File | null): HTMLInputElement {
      return { files: file ? [file] : [], value: 'x' } as unknown as HTMLInputElement;
    }

    beforeEach(() => {
      camera = jasmine.createSpyObj('CameraService', ['capture']);
      track$ = jasmine.createSpy('stopTrack');
      realRecorder = (window as any).MediaRecorder;
      realAudio = (window as any).Audio;
      (window as any).MediaRecorder = FakeRecorder;
      (window as any).Audio = FakeAudio;
      spyOn(URL, 'createObjectURL').and.returnValue('blob:preview');
      spyOn(URL, 'revokeObjectURL');
      TestBed.configureTestingModule({
        imports: [MediaCaptureComponent],
        providers: [{ provide: CameraService, useValue: camera }],
      });
    });

    afterEach(() => {
      (window as any).MediaRecorder = realRecorder;
      (window as any).Audio = realAudio;
    });

    it('takes a photo with the host camera and emits it as a blob', () => {
      camera.capture.and.returnValue(of(PNG));
      create('photo');
      (fixture.nativeElement.querySelector('button.consent-media-capture') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(emitted.length).toBe(1);
      expect(emitted[0]!.blob.type).toBe('image/png');
      expect(emitted[0]!.durationSec).toBeNull();
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('ignores a camera dialog closed without a photo', () => {
      camera.capture.and.returnValue(of(false));
      create('photo');
      component.takePhoto();
      camera.capture.and.returnValue(of(undefined));
      component.takePhoto();
      expect(emitted.length).toBe(0);
    });

    it('offers an image upload and accepts a file', () => {
      create('photo');
      expect(fixture.nativeElement.querySelector('input[type="file"]').getAttribute('accept')).toBe('image/*');
      const file = new File(['x'], 'p.png', { type: 'image/png' });
      const input = fileInput(file);
      component.onFile(input);
      expect(emitted[0]!.blob).toBe(file);
      expect(input.value).toBe('');
      component.onFile(fileInput(null));
      expect(emitted.length).toBe(1);
    });

    it('retake clears the capture and revokes the preview', () => {
      camera.capture.and.returnValue(of(PNG));
      create('photo');
      component.takePhoto();
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('button.consent-media-retake') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(emitted[1]).toBeNull();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
      expect(component.previewUrl).toBeNull();
      component.retake();
      expect(emitted[2]).toBeNull();
    });

    it('records a 30-60 s voice clip and stops the microphone', fakeAsync(() => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        Promise.resolve({ getTracks: () => [{ stop: track$ }] } as unknown as MediaStream)
      );
      create('voice');
      expect(fixture.nativeElement.querySelector('input[type="file"]').getAttribute('accept')).toBe('audio/*');
      (fixture.nativeElement.querySelector('button.consent-media-record') as HTMLButtonElement).click();
      flush();
      fixture.detectChanges();
      expect(component.recording).toBeTrue();
      tick(45000);
      (fixture.nativeElement.querySelector('button.consent-media-stop') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(emitted[0]!.durationSec).toBe(45);
      expect(emitted[0]!.blob.type).toBe('audio/ogg');
      expect(track$).toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('audio')).not.toBeNull();
    }));

    it('rejects clips that are too short or too long', fakeAsync(() => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        Promise.resolve({ getTracks: () => [{ stop: track$ }] } as unknown as MediaStream)
      );
      create('voice');
      component.startRecording();
      flush();
      FakeRecorder.last.mimeType = '';
      tick(20000);
      component.stopRecording();
      fixture.detectChanges();
      expect(component.error).toBe('voiceTooShort');
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Too short');
      component.startRecording();
      flush();
      tick(70000);
      component.stopRecording();
      expect(component.error).toBe('voiceTooLong');
      expect(emitted.length).toBe(0);
    }));

    it('falls back to upload when the microphone is denied', fakeAsync(() => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.reject(new Error('denied')));
      create('voice');
      component.startRecording();
      flush();
      fixture.detectChanges();
      expect(component.micDenied).toBeTrue();
      expect(fixture.nativeElement.querySelector('button.consent-media-record')).toBeNull();
      expect(fixture.nativeElement.querySelector('input[type="file"]')).not.toBeNull();
    }));

    it('reads an uploaded clip duration from its metadata', fakeAsync(() => {
      create('voice');
      FakeAudio.duration = 40;
      component.onFile(fileInput(new File(['a'], 'v.webm', { type: 'audio/webm' })));
      tick();
      expect(emitted[0]!.durationSec).toBe(40);
      FakeAudio.duration = 10;
      component.onFile(fileInput(new File(['a'], 'v.webm', { type: 'audio/webm' })));
      tick();
      expect(component.error).toBe('voiceTooShort');
    }));

    it('ignores stop without a recording and releases everything on destroy', fakeAsync(() => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        Promise.resolve({ getTracks: () => [{ stop: track$ }] } as unknown as MediaStream)
      );
      create('voice');
      component.stopRecording();
      component.startRecording();
      flush();
      component.previewUrl = 'blob:old';
      fixture.destroy();
      expect(track$).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old');
    }));

    it('dataUrlToBlob defaults the type when the header has none', () => {
      expect(dataUrlToBlob('data:;base64,YQ==').type).toBe('application/octet-stream');
      expect(dataUrlToBlob(PNG).size).toBeGreaterThan(0);
    });
  });
}
