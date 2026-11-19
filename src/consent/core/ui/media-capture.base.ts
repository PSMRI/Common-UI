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

import { Directive, EventEmitter, Input, OnDestroy, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CameraService } from 'src/app/app-modules/core/services';
import { RecordingUploadState } from '../consent.models';
import { isEvidenceSizeValid, isVoiceDurationValid, maxEvidenceBytes } from '../evidence.util';

export interface CapturedMedia {
  blob: Blob;
  durationSec: number | null;
}

/** Turns a data URL from the host camera dialog into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Photo (host CameraService) or voice clip (browser MediaRecorder), with file upload as fallback
 * (FR-014a, FR-015, research R7). Captured media is kept in memory only.
 */
@Directive()
export abstract class MediaCaptureBase implements OnDestroy {
  @Input() text: any;
  @Input() kind: 'photo' | 'voice' = 'photo';
  @Input() label = '';
  /** Feature 003: voice length limits; Read aloud agreement uses 2–60. */
  /** Feature 003: record button text; empty means the default voice clip text. */
  @Input() recordLabel = '';
  /** Feature 003: upload button text; empty means the default text. */
  @Input() uploadLabel = '';
  /** Feature 003: offer "Upload to server" for an accepted recording; the host does the upload. */
  @Input() serverUpload = false;
  @Input() uploadState: RecordingUploadState = 'IDLE';
  @Output() uploadRequested = new EventEmitter<void>();
  @Input() minSeconds = 30;
  @Input() maxSeconds = 60;
  @Output() captured = new EventEmitter<CapturedMedia | null>();

  previewUrl: string | null = null;
  recording = false;
  /** Seconds since recording started, shown next to the stop button. */
  elapsedSec = 0;
  micDenied = false;
  error: 'voiceTooShort' | 'voiceTooLong' | 'fileTooLarge' | null = null;

  protected cameraService = inject(CameraService);
  // Zard's dialog container is OnPush: async updates must mark this view for checking.
  protected cdr = inject(ChangeDetectorRef);
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;

  takePhoto(): void {
    this.cameraService.capture().subscribe((result: unknown) => {
      if (typeof result === 'string' && result.startsWith('data:')) {
        this.accept(dataUrlToBlob(result), null);
      }
    });
  }

  startRecording(): void {
    this.revoke();
    this.error = null;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.stream = stream;
        this.chunks = [];
        this.recorder = new MediaRecorder(stream);
        this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
        this.recorder.onstop = () => this.onRecorded();
        this.startedAt = Date.now();
        this.recorder.start();
        this.recording = true;
        this.elapsedSec = 0;
        this.ticker = setInterval(() => {
          this.elapsedSec = Math.floor((Date.now() - this.startedAt) / 1000);
          this.cdr.markForCheck();
        }, 1000);
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.micDenied = true;
        this.cdr.markForCheck();
      });
  }

  stopRecording(): void {
    if (this.recorder) {
      this.recorder.stop();
    }
  }

  onFile(input: HTMLInputElement): void {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (this.kind === 'photo') {
      this.accept(file, null);
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      this.checkVoice(file, audio.duration);
    };
    audio.src = url;
  }

  retake(): void {
    this.revoke();
    this.error = null;
    this.captured.emit(null);
  }

  ngOnDestroy(): void {
    this.stopTicker();
    this.revoke();
    this.releaseStream();
  }

  /** The error message; non-default limits use the `{min}` / `{max}` texts (feature 003). */
  get errorText(): string {
    if (!this.error) {
      return '';
    }
    if (this.error === 'fileTooLarge') {
      const mb = String(maxEvidenceBytes(this.kind) / (1024 * 1024));
      return (this.text?.fileTooLarge || '').replace('{max}', mb);
    }
    let key: string = this.error;
    if (this.error === 'voiceTooShort' && this.minSeconds !== 30) {
      key = 'voiceTooShortMin';
    } else if (this.error === 'voiceTooLong' && this.maxSeconds !== 60) {
      key = 'voiceTooLongMax';
    }
    const message: string = this.text?.[key] || '';
    return message.replace('{min}', String(this.minSeconds)).replace('{max}', String(this.maxSeconds));
  }

  /** m:ss for the recording timer. */
  get elapsedLabel(): string {
    const seconds = this.elapsedSec % 60;
    return `${Math.floor(this.elapsedSec / 60)}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  private onRecorded(): void {
    const seconds = (Date.now() - this.startedAt) / 1000;
    const type = this.recorder && this.recorder.mimeType ? this.recorder.mimeType : 'audio/webm';
    this.recording = false;
    this.recorder = null;
    this.stopTicker();
    this.releaseStream();
    this.checkVoice(new Blob(this.chunks, { type }), seconds);
  }

  private checkVoice(blob: Blob, seconds: number): void {
    if (isVoiceDurationValid(seconds, this.minSeconds, this.maxSeconds)) {
      this.accept(blob, Math.round(seconds));
    } else {
      // Keep the clip playable so staff can hear it, but do not offer it as proof.
      this.revoke();
      this.previewUrl = URL.createObjectURL(blob);
      this.error = seconds < this.minSeconds ? 'voiceTooShort' : 'voiceTooLong';
    }
    this.cdr.markForCheck();
  }

  private accept(blob: Blob, durationSec: number | null): void {
    this.revoke();
    if (!isEvidenceSizeValid(blob, this.kind)) {
      // The Consent-API would refuse it; ask for a shorter clip or a smaller photo.
      this.error = 'fileTooLarge';
      this.captured.emit(null);
      this.cdr.markForCheck();
      return;
    }
    this.error = null;
    this.previewUrl = URL.createObjectURL(blob);
    this.captured.emit({ blob, durationSec });
    this.cdr.markForCheck();
  }

  private revoke(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private releaseStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
