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
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { ClassValue } from 'clsx';

import { ZardPaginationComponent } from '../pagination';
import { ZardSelectImports } from '../select';
import { mergeClasses } from '../utils/merge-classes';

/**
 * A "smart" client-side paginator that composes the presentational `z-pagination`
 * primitive with a rows-per-page selector, and owns the page/size state + slicing.
 *
 * It removes the boilerplate each table screen used to hand-roll
 * (`totalPages`/`pagedList`/`goToPage`/`prevPage`/`nextPage`/`changePageSize`).
 *
 * Usage — the parent still renders its own table rows from the emitted slice:
 *   <z-paginator [zData]="filteredList" (zPagedChange)="pagedItems = $event"></z-paginator>
 *   <!-- or read it directly: <z-paginator #p [zData]="list"/> ... *ngFor="let x of p.pagedItems()" -->
 */
@Component({
  selector: 'z-paginator, [z-paginator]',
  imports: [ZardPaginationComponent, ...ZardSelectImports],
  template: `
    @if (totalItems() > 0) {
      <div class="flex flex-wrap items-center justify-end gap-4">
        @if (zShowPageSize()) {
          <div
            class="inline-flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
            <span>{{ zRowsPerPageLabel() }}</span>
            <z-select
              class="w-[4.5rem]"
              name="pageSize"
              [zValue]="pageSize().toString()"
              (zSelectionChange)="onPageSizeChange($event)">
              @for (size of zPageSizeOptions(); track size) {
                <z-select-item [zValue]="size.toString()">{{ size }}</z-select-item>
              }
            </z-select>
          </div>
        }
        <z-pagination
          class="mx-0 w-auto justify-end"
          [zPageIndex]="currentPage()"
          [zTotal]="totalPages()"
          (zPageIndexChange)="currentPage.set($event)"></z-pagination>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'paginator',
    '[class]': 'classes()',
  },
  exportAs: 'zPaginator',
})
export class ZardPaginatorComponent {
  /** The full list to paginate. */
  readonly zData = input<readonly unknown[] | null | undefined>([]);
  /** Rows-per-page choices; the first is the initial page size. */
  readonly zPageSizeOptions = input<number[]>([5, 10, 20]);
  /** Whether to show the rows-per-page selector. */
  readonly zShowPageSize = input(true, { transform: booleanAttribute });
  /** Label shown before the rows-per-page selector. */
  readonly zRowsPerPageLabel = input('Rows per page');
  readonly class = input<ClassValue>('');

  /** Emits the current page's slice whenever page/size/data changes. */
  readonly zPagedChange = output<unknown[]>();

  /** Page size — defaults to (and re-syncs with) the first option. */
  readonly pageSize = linkedSignal(() => this.zPageSizeOptions()[0] ?? 5);
  readonly currentPage = signal(1);

  readonly totalItems = computed(() => (this.zData() ?? []).length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize()))
  );
  readonly pagedItems = computed<unknown[]>(() => {
    const items = this.zData() ?? [];
    const size = this.pageSize();
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  });

  protected readonly classes = computed(() =>
    mergeClasses('block w-full', this.class())
  );

  constructor() {
    // Reset to the first page whenever the underlying list changes (e.g. a new search).
    effect(
      () => {
        this.zData();
        this.currentPage.set(1);
      },
      { allowSignalWrites: true }
    );
    // Publish the current page's slice to consumers that bind (zPagedChange).
    effect(() => this.zPagedChange.emit(this.pagedItems()));
  }

  protected onPageSizeChange(value: string | string[]): void {
    const next = Array.isArray(value) ? value[0] : value;
    this.pageSize.set(Number(next));
    this.currentPage.set(1);
  }
}
