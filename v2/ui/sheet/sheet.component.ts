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

import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';

import {
  sheetClosedTransform,
  sheetOpenTransform,
  sheetVariants,
  type ZardSheetVariants,
} from './sheet.variants';

@Component({
  selector: 'z-sheet, [z-sheet]',
  imports: [NgIcon],
  template: `
    <!-- Backdrop: always mounted; fades in/out so close animates too. -->
    <div [class]="backdropClasses()" (click)="close()"></div>

    <!-- Panel: always mounted; slides via transition-transform on open/close. -->
    <div
      #panel
      [class]="panelClasses()"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      (keydown.tab)="onTab($event)">
      <header class="flex items-center justify-between gap-4">
        @if (zTitle()) {
          <p class="text-lg font-semibold text-foreground">{{ zTitle() }}</p>
        }
        <button
          type="button"
          aria-label="Close"
          class="appearance-none border-0 bg-transparent ml-auto inline-flex items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
          (click)="close()">
          <ng-icon name="lucideX" size="1rem" />
        </button>
      </header>

      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideX })],
  exportAs: 'zSheet',
  host: {
    '[class]': 'classes()',
    '(keydown.escape)': 'close()',
  },
})
export class ZardSheetComponent {
  private readonly document = inject(DOCUMENT);

  readonly zSide = input<NonNullable<ZardSheetVariants['zSide']>>('right');
  readonly zOpen = model<boolean>(false);
  readonly zTitle = input<string>('');
  readonly class = input<ClassValue>('');

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Element focused before the sheet opened, restored on close. */
  private previouslyFocused: HTMLElement | null = null;

  protected readonly classes = computed(() =>
    mergeClasses('contents', this.class())
  );

  protected readonly backdropClasses = computed(() =>
    mergeClasses(
      'fixed inset-0 z-50 bg-black/50 transition-opacity',
      this.zOpen()
        ? 'opacity-100 pointer-events-auto'
        : 'opacity-0 pointer-events-none'
    )
  );

  protected readonly panelClasses = computed(() =>
    mergeClasses(
      sheetVariants({ zSide: this.zSide() }),
      // Always mounted: open => slid into place, closed => off-screen, so the
      // transition-transform animates both directions.
      this.zOpen()
        ? `${sheetOpenTransform({ zSide: this.zSide() })} pointer-events-auto`
        : `${sheetClosedTransform({ zSide: this.zSide() })} pointer-events-none`
    )
  );

  constructor() {
    // Move focus into the sheet on open and restore it on close.
    effect(() => {
      const open = this.zOpen();
      const panelEl = this.panel()?.nativeElement;
      if (!panelEl) {
        return;
      }
      if (open) {
        this.previouslyFocused = this.document
          .activeElement as HTMLElement | null;
        // Focus the first focusable element, falling back to the panel itself.
        const focusable = this.getFocusableElements(panelEl);
        (focusable[0] ?? panelEl).focus();
      } else if (this.previouslyFocused) {
        this.previouslyFocused.focus();
        this.previouslyFocused = null;
      }
    });
  }

  /** Basic focus trap: wrap focus within the panel on Tab / Shift+Tab. */
  protected onTab(rawEvent: Event): void {
    const event = rawEvent as KeyboardEvent;
    const panelEl = this.panel()?.nativeElement;
    if (!panelEl) {
      return;
    }

    const focusable = this.getFocusableElements(panelEl);
    if (focusable.length === 0) {
      event.preventDefault();
      panelEl.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === panelEl) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector =
      'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      el => el.offsetParent !== null || el === container
    );
  }

  close(): void {
    this.zOpen.set(false);
  }
}
