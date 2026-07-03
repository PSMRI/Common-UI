/*
 * AMRIT – Accessible Medical Records via Integrated Technologies
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

import type { OverlayRef } from '@angular/cdk/overlay';
import { isPlatformBrowser } from '@angular/common';
import { EventEmitter, Inject, PLATFORM_ID } from '@angular/core';

import { filter, fromEvent, Observable, Subject, takeUntil } from 'rxjs';

import type { ZardDialogComponent, ZardDialogOptions } from './dialog.component';

const enum eTriggerAction {
  CANCEL = 'cancel',
  OK = 'ok',
}

export class ZardDialogRef<T = any, R = any, U = any> {
  private destroy$ = new Subject<void>();
  private readonly afterClosed$ = new Subject<R | undefined>();
  private isClosing = false;
  protected result?: R;
  componentInstance: T | null = null;

  constructor(
    private overlayRef: OverlayRef,
    private config: ZardDialogOptions<T, U>,
    private containerInstance: ZardDialogComponent<T, U>,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.containerInstance.cancelTriggered.subscribe(() => this.trigger(eTriggerAction.CANCEL));
    this.containerInstance.okTriggered.subscribe(() => this.trigger(eTriggerAction.OK));

    if ((this.config.zMaskClosable ?? true) && isPlatformBrowser(this.platformId)) {
      this.overlayRef
        .outsidePointerEvents()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.close());
    }

    if (isPlatformBrowser(this.platformId)) {
      fromEvent<KeyboardEvent>(document, 'keydown')
        .pipe(
          filter(event => event.key === 'Escape'),
          takeUntil(this.destroy$),
        )
        .subscribe(() => this.close());
    }
  }

  close(result?: R) {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.result = result;

    if (isPlatformBrowser(this.platformId)) {
      const hostElement = this.containerInstance.getNativeElement();
      hostElement.classList.add('dialog-leave');
    }

    setTimeout(() => {
      if (this.overlayRef) {
        if (this.overlayRef.hasAttached()) {
          this.overlayRef.detachBackdrop();
        }
        this.overlayRef.dispose();
      }

      if (!this.destroy$.closed) {
        this.destroy$.next();
        this.destroy$.complete();
      }

      this.afterClosed$.next(this.result);
      this.afterClosed$.complete();
    }, 150);
  }

  /**
   * Emits the close result once, after the dialog has closed, then completes.
   * Mirrors MatDialogRef.afterClosed() so callers migrating off Material keep
   * the `create(...).afterClosed().subscribe(result => ...)` pattern unchanged.
   */
  afterClosed(): Observable<R | undefined> {
    return this.afterClosed$.asObservable();
  }

  private trigger(action: eTriggerAction) {
    const trigger = { ok: this.config.zOnOk, cancel: this.config.zOnCancel }[action];

    if (trigger instanceof EventEmitter) {
      trigger.emit(this.getContentComponent());
    } else if (typeof trigger === 'function') {
      const result = trigger(this.getContentComponent()) as R;
      this.closeWithResult(result);
    } else {
      this.close();
    }
  }

  private getContentComponent(): T {
    return this.componentInstance as T;
  }

  private closeWithResult(result: R): void {
    if (result !== false) {
      this.close(result);
    }
  }
}
