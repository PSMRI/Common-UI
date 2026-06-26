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

import {
  type ConnectedPosition,
  Overlay,
  OverlayPositionBuilder,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';
import { tooltipVariants, type ZardTooltipPosition } from './tooltip.variants';

@Component({
  selector: 'z-tooltip',
  template: `{{ text() }}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()', '[id]': 'id()', role: 'tooltip' },
})
export class ZardTooltipComponent {
  readonly text = input<string>('');
  readonly id = input<string>('');
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(tooltipVariants(), this.class()));
}

const POSITIONS: Record<ZardTooltipPosition, ConnectedPosition[]> = {
  top: [{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 }],
  bottom: [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 }],
  left: [{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 }],
  right: [{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 }],
};

let uniqueId = 0;

@Directive({
  selector: '[zTooltip]',
  exportAs: 'zTooltip',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
  },
})
export class ZardTooltipDirective implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly positionBuilder = inject(OverlayPositionBuilder);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private overlayRef?: OverlayRef;
  private showTimer?: ReturnType<typeof setTimeout>;
  private readonly tooltipId = `z-tooltip-${uniqueId++}`;

  readonly zTooltip = input<string>('');
  readonly zPosition = input<ZardTooltipPosition>('top');
  /** Delay (ms) before the tooltip appears on hover/focus. */
  readonly zDelay = input<number>(0);

  show(): void {
    if (!this.zTooltip() || this.overlayRef?.hasAttached()) {
      return;
    }
    clearTimeout(this.showTimer);
    this.showTimer = setTimeout(() => this.attach(), this.zDelay());
  }

  hide(): void {
    clearTimeout(this.showTimer);
    this.overlayRef?.detach();
    this.elementRef.nativeElement.removeAttribute('aria-describedby');
  }

  private attach(): void {
    if (!this.overlayRef) {
      this.createOverlay();
    }
    if (this.overlayRef!.hasAttached()) {
      return;
    }
    const ref = this.overlayRef!.attach(new ComponentPortal(ZardTooltipComponent));
    ref.setInput('text', this.zTooltip());
    ref.setInput('id', this.tooltipId);
    // Associate the trigger with the tooltip for screen readers (parity with mdTooltip).
    this.elementRef.nativeElement.setAttribute('aria-describedby', this.tooltipId);
  }

  private createOverlay(): void {
    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions(POSITIONS[this.zPosition()]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.showTimer);
    this.elementRef.nativeElement.removeAttribute('aria-describedby');
    this.overlayRef?.dispose();
  }
}
