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
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';

import {
  sheetClosedTransform,
  sheetVariants,
  type ZardSheetVariants,
} from './sheet.variants';

@Component({
  selector: 'z-sheet, [z-sheet]',
  imports: [NgIcon],
  template: `
    @if (zOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-50 bg-black/50 transition-opacity"
        (click)="close()"></div>

      <!-- Panel -->
      <div [class]="panelClasses()" role="dialog" aria-modal="true">
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
    }
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
  readonly zSide = input<NonNullable<ZardSheetVariants['zSide']>>('right');
  readonly zOpen = model<boolean>(false);
  readonly zTitle = input<string>('');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses('contents', this.class())
  );

  protected readonly panelClasses = computed(() =>
    mergeClasses(
      sheetVariants({ zSide: this.zSide() }),
      // Open => slid into place (no transform); closed => off-screen.
      this.zOpen() ? '' : sheetClosedTransform({ zSide: this.zSide() })
    )
  );

  close(): void {
    this.zOpen.set(false);
  }
}
