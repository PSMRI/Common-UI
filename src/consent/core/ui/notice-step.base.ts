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

import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Notice } from '../consent.models';

/** Largest gap (s) between two timeupdate events still counted as listening, not seeking. */
const MAX_PLAY_STEP = 1.5;

/** Notice step logic shared by both tracks: read or heard to the end (FR-003 to FR-005, research R9). */
@Directive()
export abstract class NoticeStepBase implements AfterViewInit, OnChanges, OnDestroy {
  @Input() notice!: Notice;
  @Input() text: any;
  @Output() readComplete = new EventEmitter<void>();
  @Output() audioPlayedToEnd = new EventEmitter<void>();

  @ViewChild('scrollBox') scrollBox?: ElementRef<HTMLElement>;
  @ViewChild('endMarker') endMarker?: ElementRef<HTMLElement>;

  audioFailed = false;
  private observer: IntersectionObserver | null = null;
  private reported = false;
  private lastTime = 0;
  private playedSeconds = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notice'] && !changes['notice'].firstChange) {
      this.reset();
      this.watchEnd();
    }
  }

  ngAfterViewInit(): void {
    this.watchEnd();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  onScroll(): void {
    const box = this.scrollBox?.nativeElement;
    if (box && box.scrollTop + box.clientHeight >= box.scrollHeight - 2) {
      this.reportRead();
    }
  }

  onTimeUpdate(audio: HTMLAudioElement): void {
    const step = audio.currentTime - this.lastTime;
    if (step > 0 && step <= MAX_PLAY_STEP) {
      this.playedSeconds += step;
    }
    this.lastTime = audio.currentTime;
  }

  onEnded(audio: HTMLAudioElement): void {
    if (this.playedSeconds >= audio.duration - MAX_PLAY_STEP) {
      this.audioPlayedToEnd.emit();
      this.reportRead();
    }
  }

  onAudioError(): void {
    this.audioFailed = true;
  }

  private watchEnd(): void {
    this.disconnect();
    const marker = this.endMarker?.nativeElement;
    if (!marker) {
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      this.onScroll();
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.reportRead();
        }
      },
      { root: this.scrollBox?.nativeElement || null }
    );
    this.observer.observe(marker);
  }

  private reportRead(): void {
    if (!this.reported) {
      this.reported = true;
      this.readComplete.emit();
    }
  }

  private reset(): void {
    this.reported = false;
    this.audioFailed = false;
    this.lastTime = 0;
    this.playedSeconds = 0;
  }

  private disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
