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

import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';
import { NgxSonnerToaster } from 'ngx-sonner';

import { mergeClasses } from '../utils/merge-classes';

import { toastVariants, type ZardToastVariants } from './toast.variants';

@Component({
  selector: 'z-toast, z-toaster',
  imports: [NgxSonnerToaster],
  template: `
    <ngx-sonner-toaster
      [theme]="theme()"
      [class]="classes()"
      [position]="position()"
      [richColors]="richColors()"
      [expand]="expand()"
      [duration]="duration()"
      [visibleToasts]="visibleToasts()"
      [closeButton]="closeButton()"
      [toastOptions]="toastOptions()"
      [dir]="dir()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zToast',
})
export class ZardToastComponent {
  readonly class = input<ClassValue>('');
  readonly variant = input<ZardToastVariants>('default');
  readonly theme = input<'light' | 'dark' | 'system'>('system');
  readonly position = input<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>(
    'bottom-right',
  );

  readonly richColors = input<boolean>(false);
  readonly expand = input<boolean>(false);
  readonly duration = input<number>(4000);
  readonly visibleToasts = input<number>(3);
  readonly closeButton = input<boolean>(false);
  readonly toastOptions = input<Record<string, unknown>>({});
  readonly dir = input<'ltr' | 'rtl' | 'auto'>('auto');

  protected readonly classes = computed(() =>
    mergeClasses('toaster group', toastVariants({ variant: this.variant() }), this.class()),
  );
}
