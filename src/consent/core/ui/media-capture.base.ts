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

import { Directive, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { CameraService } from 'src/app/app-modules/core/services';
import { isVoiceDurationValid } from '../evidence.util';

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
  @Output() captured = new EventEmitter<CapturedMedia | null>();

  previewUrl: string | null = null;
  recording = false;
  micDenied = false;
  error: 'voiceTooShort' | 'voiceTooLong' | null = null;

  protected cameraService = inject(CameraService);
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  takePhoto(): void {
    this.cameraService.capture().subscribe((result: unknown) => {
      if (typeof result === 'string' && result.startsWith('data:')) {
        this.accept(dataUrlToBlob(result), null);
      }
    });
  }

  startRecording(): void {
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
      })
      .catch(() => {
        this.micDenied = true;
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
    this.revoke();
    this.releaseStream();
  }

  private onRecorded(): void {
    const seconds = (Date.now() - this.startedAt) / 1000;
    const type = this.recorder && this.recorder.mimeType ? this.recorder.mimeType : 'audio/webm';
    this.recording = false;
    this.recorder = null;
    this.releaseStream();
    this.checkVoice(new Blob(this.chunks, { type }), seconds);
  }

  private checkVoice(blob: Blob, seconds: number): void {
    if (isVoiceDurationValid(seconds)) {
      this.accept(blob, Math.round(seconds));
    } else {
      this.error = seconds < 30 ? 'voiceTooShort' : 'voiceTooLong';
    }
  }

  private accept(blob: Blob, durationSec: number | null): void {
    this.revoke();
    this.error = null;
    this.previewUrl = URL.createObjectURL(blob);
    this.captured.emit({ blob, durationSec });
  }

  private revoke(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  private releaseStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
