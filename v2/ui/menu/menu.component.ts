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
  inject,
  input,
  output,
  type TemplateRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';
import { menuItemVariants, menuVariants } from './menu.variants';

@Component({
  selector: 'z-menu',
  template: `
    <ng-template #zMenuTemplate>
      <div [class]="classes()" role="menu"><ng-content /></div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zMenu',
})
export class ZardMenuComponent {
  readonly class = input<ClassValue>('');
  readonly closed = output<void>();
  readonly templateRef = viewChild.required<TemplateRef<unknown>>('zMenuTemplate');
  protected readonly classes = computed(() => mergeClasses(menuVariants(), this.class()));

  requestClose(): void {
    this.closed.emit();
  }
}

@Component({
  selector: 'z-menu-item, button[z-menu-item]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()', role: 'menuitem', '(click)': 'onClick()' },
  exportAs: 'zMenuItem',
})
export class ZardMenuItemComponent {
  private readonly menu = inject(ZardMenuComponent, { optional: true });
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(menuItemVariants(), this.class()));

  onClick(): void {
    this.menu?.requestClose();
  }
}
