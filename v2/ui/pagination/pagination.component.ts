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

import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucideEllipsis } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import {
  ZardButtonComponent,
  type ZardButtonSizeVariants,
  type ZardButtonTypeVariants,
} from '../button';
import {
  paginationContentVariants,
  paginationEllipsisVariants,
  paginationNextVariants,
  paginationPreviousVariants,
  paginationVariants,
} from './pagination.variants';
import { mergeClasses } from '../utils/merge-classes';

@Component({
  selector: 'ul[z-pagination-content]',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'pagination-content',
    '[class]': 'classes()',
  },
  exportAs: 'zPaginationContent',
})
export class ZardPaginationContentComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationContentVariants(), this.class()));
}

@Component({
  selector: 'li[z-pagination-item]',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'pagination-item',
  },
  exportAs: 'zPaginationItem',
})
export class ZardPaginationItemComponent {}
// Structural wrapper component for pagination items (<li>). No inputs required.

@Component({
  selector: 'button[z-pagination-button], a[z-pagination-button]',
  imports: [ZardButtonComponent],
  template: `
    <z-button
      [attr.data-active]="zActive() || null"
      [class]="class()"
      [zDisabled]="zDisabled()"
      [zSize]="zSize()"
      [zType]="zType()"
    >
      <ng-content />
    </z-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'pagination-button',
  },
  exportAs: 'zPaginationButton',
})
export class ZardPaginationButtonComponent {
  readonly class = input<ClassValue>('');
  readonly zActive = input(false, { transform: booleanAttribute });
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zSize = input<ZardButtonSizeVariants>('default');

  protected readonly zType = computed<ZardButtonTypeVariants>(() => (this.zActive() ? 'outline' : 'ghost'));
}

@Component({
  selector: 'z-pagination-previous',
  imports: [ZardPaginationButtonComponent, NgIcon],
  template: `
    <button
      type="button"
      z-pagination-button
      [attr.disabled]="zDisabled() ? '' : null"
      [class]="classes()"
      [zSize]="zSize()"
      [zDisabled]="zDisabled()"
    >
      <span class="sr-only">To previous page</span>
      <ng-icon name="lucideChevronLeft" aria-hidden="true" />
      <span class="hidden sm:block" aria-hidden="true">Previous</span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideChevronLeft })],
  exportAs: 'zPaginationPrevious',
})
export class ZardPaginationPreviousComponent {
  readonly class = input<ClassValue>('');
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zSize = input<ZardButtonSizeVariants>('default');

  protected readonly classes = computed(() => mergeClasses(paginationPreviousVariants(), this.class()));
}

@Component({
  selector: 'z-pagination-next',
  imports: [ZardPaginationButtonComponent, NgIcon],
  template: `
    <button
      type="button"
      z-pagination-button
      [attr.disabled]="zDisabled() ? '' : null"
      [class]="classes()"
      [zDisabled]="zDisabled()"
      [zSize]="zSize()"
    >
      <span class="sr-only">To next page</span>
      <span class="hidden sm:block" aria-hidden="true">Next</span>
      <ng-icon name="lucideChevronRight" aria-hidden="true" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideChevronRight })],
  exportAs: 'zPaginationNext',
})
export class ZardPaginationNextComponent {
  readonly class = input<ClassValue>('');
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zSize = input<ZardButtonSizeVariants>('default');

  protected readonly classes = computed(() => mergeClasses(paginationNextVariants(), this.class()));
}

@Component({
  selector: 'z-pagination-ellipsis',
  imports: [NgIcon],
  template: `
    <ng-icon name="lucideEllipsis" aria-hidden="true" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideEllipsis })],
  host: {
    '[class]': 'classes()',
    'aria-hidden': 'true',
  },
  exportAs: 'zPaginationEllipsis',
})
export class ZardPaginationEllipsisComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(paginationEllipsisVariants(), this.class()));
}

@Component({
  selector: 'z-pagination',
  imports: [
    ZardPaginationContentComponent,
    ZardPaginationItemComponent,
    ZardPaginationButtonComponent,
    ZardPaginationPreviousComponent,
    ZardPaginationNextComponent,
    NgTemplateOutlet,
  ],
  template: `
    @if (zContent()) {
      <ng-container *ngTemplateOutlet="zContent()" />
    } @else {
      <ul z-pagination-content>
        <li z-pagination-item>
          @let pagePrevious = Math.max(1, zPageIndex() - 1);
          <z-pagination-previous
            [zSize]="zSize()"
            [zDisabled]="zDisabled() || zPageIndex() === 1"
            (click)="goToPage(pagePrevious)"
          />
        </li>

        @for (page of pages(); track page) {
          <li z-pagination-item>
            <button
              z-pagination-button
              type="button"
              class="focus-visible:rounded-md"
              [attr.aria-current]="page === zPageIndex() ? 'page' : null"
              [attr.aria-disabled]="zDisabled() || null"
              [zActive]="page === zPageIndex()"
              [zDisabled]="zDisabled()"
              [zSize]="zSize()"
              (click)="goToPage(page)"
            >
              <span class="sr-only">{{ pages().length === page ? 'To last page, page' : 'To page' }}</span>
              {{ page }}
            </button>
          </li>
        }

        <li z-pagination-item>
          @let pageNext = Math.min(zPageIndex() + 1, zTotal());
          <z-pagination-next
            [zSize]="zSize()"
            [zDisabled]="zDisabled() || zPageIndex() === zTotal()"
            (click)="goToPage(pageNext)"
          />
        </li>
      </ul>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'group',
    '[attr.aria-label]': 'zAriaLabel()',
    'data-slot': 'pagination',
    '[class]': 'classes()',
  },
  exportAs: 'zPagination',
})
export class ZardPaginationComponent {
  readonly zPageIndex = model<number>(1);
  readonly zTotal = input<number>(1);
  readonly zSize = input<ZardButtonSizeVariants>('default');
  readonly zDisabled = input(false, { transform: booleanAttribute });
  readonly zContent = input<TemplateRef<void> | undefined>();
  readonly zAriaLabel = input('Pagination');

  readonly class = input<ClassValue>('');

  readonly zPageIndexChange = output<number>();
  readonly Math = Math;

  protected readonly classes = computed(() => mergeClasses(paginationVariants(), this.class()));
  readonly pages = computed<number[]>(() => Array.from({ length: Math.max(0, this.zTotal()) }, (_, i) => i + 1));

  goToPage(page: number): void {
    if (!this.zDisabled() && page !== this.zPageIndex()) {
      this.zPageIndex.set(page);
      this.zPageIndexChange.emit(page);
    }
  }
}
