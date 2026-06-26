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
  host: { '[class]': 'classes()', role: 'tooltip' },
})
export class ZardTooltipComponent {
  readonly text = input<string>('');
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(tooltipVariants(), this.class()));
}

const POSITIONS: Record<ZardTooltipPosition, ConnectedPosition[]> = {
  top: [{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 }],
  bottom: [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 }],
  left: [{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 }],
  right: [{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 }],
};

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

  readonly zTooltip = input<string>('');
  readonly zPosition = input<ZardTooltipPosition>('top');

  show(): void {
    const text = this.zTooltip();
    if (!text || this.overlayRef?.hasAttached()) {
      return;
    }
    if (!this.overlayRef) {
      this.createOverlay();
    }
    const ref = this.overlayRef!.attach(new ComponentPortal(ZardTooltipComponent));
    ref.setInput('text', text);
  }

  hide(): void {
    this.overlayRef?.detach();
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
    this.overlayRef?.dispose();
  }
}
