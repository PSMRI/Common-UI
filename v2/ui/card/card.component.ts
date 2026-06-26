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
import { cardVariants } from './card.variants';

@Component({
  selector: 'z-card',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  exportAs: 'zCard',
})
export class ZardCardComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses(cardVariants(), this.class()));
}

@Component({
  selector: 'z-card-header',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
})
export class ZardCardHeaderComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() =>
    mergeClasses('grid auto-rows-min items-start gap-1.5 px-6', this.class()),
  );
}

@Component({
  selector: 'z-card-title',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
})
export class ZardCardTitleComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses('leading-none font-semibold', this.class()));
}

@Component({
  selector: 'z-card-description',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
})
export class ZardCardDescriptionComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() =>
    mergeClasses('text-muted-foreground text-sm', this.class()),
  );
}

@Component({
  selector: 'z-card-content',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
})
export class ZardCardContentComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses('px-6', this.class()));
}

@Component({
  selector: 'z-card-footer',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
})
export class ZardCardFooterComponent {
  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() => mergeClasses('flex items-center px-6', this.class()));
}
