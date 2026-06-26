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

import { mergeClasses } from '../utils/merge-classes';
import { listItemVariants, listVariants } from './list.variants';

@Component({
  selector: 'z-list, ul[z-list]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()', role: 'list' },
  exportAs: 'zList',
})
export class ZardListComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(listVariants(), this.class()));
}

@Component({
  selector: 'z-list-item, li[z-list-item]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()', role: 'listitem' },
  exportAs: 'zListItem',
})
export class ZardListItemComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(listItemVariants(), this.class()));
}
