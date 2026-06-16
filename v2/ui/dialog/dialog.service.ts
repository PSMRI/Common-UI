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

import { type ComponentType, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  inject,
  Injectable,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  TemplateRef,
  type ViewContainerRef,
} from '@angular/core';

import { ZardDialogRef } from './dialog-ref';
import { ZardDialogComponent, ZardDialogOptions } from './dialog.component';

type ContentType<T> = ComponentType<T> | TemplateRef<T> | string;

export const Z_MODAL_DATA = new InjectionToken<any>('Z_MODAL_DATA');

@Injectable({
  providedIn: 'root',
})
export class ZardDialogService {
  private overlay = inject(Overlay);
  private injector = inject(Injector);
  private platformId = inject(PLATFORM_ID);

  create<T, U>(config: ZardDialogOptions<T, U>): ZardDialogRef<T> {
    return this.open<T, U>(config.zContent as ComponentType<T>, config);
  }

  private open<T, U>(componentOrTemplateRef: ContentType<T>, config: ZardDialogOptions<T, U>) {
    const overlayRef = this.createOverlay();

    if (!overlayRef) {
      return new ZardDialogRef(
        undefined as unknown as OverlayRef,
        config,
        undefined as unknown as ZardDialogComponent<T, U>,
        this.platformId,
      );
    }

    const dialogContainer = this.attachDialogContainer<T, U>(overlayRef, config);
    const dialogRef = this.attachDialogContent<T, U>(componentOrTemplateRef, dialogContainer, overlayRef, config);

    dialogContainer.dialogRef = dialogRef;

    return dialogRef;
  }

  private createOverlay(): OverlayRef | undefined {
    if (isPlatformBrowser(this.platformId)) {
      const overlayConfig = new OverlayConfig({
        hasBackdrop: true,
        positionStrategy: this.overlay.position().global(),
      });

      return this.overlay.create(overlayConfig);
    }

    return undefined;
  }

  private attachDialogContainer<T, U>(overlayRef: OverlayRef, config: ZardDialogOptions<T, U>) {
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: OverlayRef, useValue: overlayRef },
        { provide: ZardDialogOptions, useValue: config },
      ],
    });

    const containerPortal = new ComponentPortal<ZardDialogComponent<T, U>>(
      ZardDialogComponent,
      config.zViewContainerRef,
      injector,
    );

    const containerRef = overlayRef.attach<ZardDialogComponent<T, U>>(containerPortal);

    return containerRef.instance;
  }

  private attachDialogContent<T, U>(
    componentOrTemplateRef: ContentType<T>,
    dialogContainer: ZardDialogComponent<T, U>,
    overlayRef: OverlayRef,
    config: ZardDialogOptions<T, U>,
  ) {
    const dialogRef = new ZardDialogRef<T>(overlayRef, config, dialogContainer, this.platformId);

    if (componentOrTemplateRef instanceof TemplateRef) {
      dialogContainer.attachTemplatePortal(
        new TemplatePortal<T>(
          componentOrTemplateRef,
          null as unknown as ViewContainerRef,
          {
            dialogRef,
          } as T,
        ),
      );
    } else if (typeof componentOrTemplateRef !== 'string') {
      const injector = this.createInjector<T, U>(dialogRef, config);
      const contentRef = dialogContainer.attachComponentPortal<T>(
        new ComponentPortal(componentOrTemplateRef, config.zViewContainerRef, injector),
      );
      dialogRef.componentInstance = contentRef.instance;
    }

    return dialogRef;
  }

  private createInjector<T, U>(dialogRef: ZardDialogRef<T>, config: ZardDialogOptions<T, U>) {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: ZardDialogRef, useValue: dialogRef },
        { provide: Z_MODAL_DATA, useValue: config.zData },
      ],
    });
  }
}
