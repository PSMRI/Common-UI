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
  host: {
    '(click)': 'toggle()',
    '(keydown)': 'onTriggerKeydown($event)',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-haspopup]': '"menu"',
  },
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
    // Move focus into the menu (parity with Material md-menu).
    queueMicrotask(() => this.focusItem(0));
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.overlayRef?.detach();
    this.isOpen.set(false);
    // Restore focus to the trigger.
    this.elementRef.nativeElement.focus();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && !this.isOpen()) {
      event.preventDefault();
      this.open();
    }
  }

  private readonly onMenuKeydown = (event: KeyboardEvent): void => {
    if (!this.isOpen()) {
      return;
    }
    const items = this.getItems();
    const current = items.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem(current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusItem(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  };

  private getItems(): HTMLElement[] {
    if (!this.overlayRef) {
      return [];
    }
    return Array.from(
      this.overlayRef.overlayElement.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ).filter((el) => el.getAttribute('aria-disabled') !== 'true');
  }

  private focusItem(index: number): void {
    const items = this.getItems();
    if (!items.length) {
      return;
    }
    const i = ((index % items.length) + items.length) % items.length;
    items[i].focus();
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
    this.overlayRef.overlayElement.addEventListener('keydown', this.onMenuKeydown);
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
