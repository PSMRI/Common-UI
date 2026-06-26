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

import { Overlay, OverlayPositionBuilder, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { ZardMenuComponent } from './menu.component';

@Directive({
  selector: '[zMenuTriggerFor]',
  exportAs: 'zMenuTrigger',
  host: { '(click)': 'toggle()', '[attr.aria-expanded]': 'isOpen()' },
})
export class ZardMenuTriggerForDirective implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly positionBuilder = inject(OverlayPositionBuilder);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private overlayRef?: OverlayRef;
  private closeSub?: { unsubscribe(): void };
  protected readonly isOpen = signal(false);

  readonly menu = input.required<ZardMenuComponent>({ alias: 'zMenuTriggerFor' });

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.isOpen()) {
      return;
    }
    if (!this.overlayRef) {
      this.createOverlay();
    }
    this.overlayRef!.attach(new TemplatePortal(this.menu().templateRef(), this.viewContainerRef));
    this.isOpen.set(true);
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.overlayRef?.detach();
    this.isOpen.set(false);
  }

  private createOverlay(): void {
    const positionStrategy = this.positionBuilder.flexibleConnectedTo(this.elementRef).withPositions([
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
    ]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    // Close on outside click (ignore clicks on the trigger itself — its own handler toggles).
    this.overlayRef.outsidePointerEvents().subscribe((event) => {
      if (!this.elementRef.nativeElement.contains(event.target as Node)) {
        this.close();
      }
    });
    // Close when a menu item requests it.
    this.closeSub = this.menu().closed.subscribe(() => this.close());
  }

  ngOnDestroy(): void {
    this.closeSub?.unsubscribe();
    this.overlayRef?.dispose();
  }
}
