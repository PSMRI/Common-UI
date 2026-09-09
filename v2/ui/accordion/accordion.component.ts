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
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';
import {
  accordionChevronVariants,
  accordionContentVariants,
  accordionItemVariants,
  accordionTriggerVariants,
  accordionVariants,
} from './accordion.variants';

export type ZardAccordionType = 'single' | 'multiple';

@Component({
  selector: 'z-accordion, [z-accordion]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  exportAs: 'zAccordion',
})
export class ZardAccordionComponent {
  readonly class = input<ClassValue>('');
  readonly zType = input<ZardAccordionType>('single');
  readonly zCollapsible = input(true, { transform: booleanAttribute });

  /** Emits the full set of currently open item values whenever it changes. */
  readonly zValueChange = output<string[]>();

  // Source of truth for which items are open.
  private readonly openValues = signal<Set<string>>(new Set());

  protected readonly classes = computed(() =>
    mergeClasses(accordionVariants(), this.class())
  );

  isOpen(value: string): boolean {
    return this.openValues().has(value);
  }

  toggle(value: string): void {
    const current = this.openValues();
    const next = new Set(current);

    if (next.has(value)) {
      // Closing the open item — only allowed when collapsible (single mode)
      // or always allowed in multiple mode.
      if (this.zType() === 'single' && !this.zCollapsible()) {
        return;
      }
      next.delete(value);
    } else if (this.zType() === 'single') {
      // Opening in single mode closes every other item.
      next.clear();
      next.add(value);
    } else {
      next.add(value);
    }

    this.openValues.set(next);
    this.zValueChange.emit([...next]);
  }
}

@Component({
  selector: 'z-accordion-item, [z-accordion-item]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.data-state]': "open() ? 'open' : 'closed'",
  },
  exportAs: 'zAccordionItem',
})
export class ZardAccordionItemComponent {
  private readonly accordion = inject(ZardAccordionComponent);

  readonly class = input<ClassValue>('');
  readonly zValue = input.required<string>();

  readonly open = computed(() => this.accordion.isOpen(this.zValue()));

  protected readonly classes = computed(() =>
    mergeClasses(accordionItemVariants(), this.class())
  );

  toggle(): void {
    this.accordion.toggle(this.zValue());
  }
}

@Component({
  selector: 'z-accordion-trigger, [z-accordion-trigger]',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideChevronDown })],
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-expanded]="open()"
      [attr.data-state]="open() ? 'open' : 'closed'"
      (click)="onClick()">
      <ng-content />
      <ng-icon name="lucideChevronDown" [class]="chevronClasses()" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zAccordionTrigger',
})
export class ZardAccordionTriggerComponent {
  private readonly item = inject(ZardAccordionItemComponent, {
    optional: true,
  });

  readonly class = input<ClassValue>('');

  readonly open = computed(() => this.item?.open() ?? false);

  protected readonly classes = computed(() =>
    mergeClasses(accordionTriggerVariants(), this.class())
  );
  protected readonly chevronClasses = computed(() =>
    accordionChevronVariants({ open: this.open() })
  );

  onClick(): void {
    this.item?.toggle();
  }
}

@Component({
  selector: 'z-accordion-content, [z-accordion-content]',
  template: `
    <div
      class="overflow-hidden"
      [attr.inert]="open() ? null : ''"
      [attr.aria-hidden]="open() ? null : 'true'">
      <div class="pb-4 pt-0">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[style.gridTemplateRows]': "open() ? '1fr' : '0fr'",
    '[attr.data-state]': "open() ? 'open' : 'closed'",
    role: 'region',
  },
  exportAs: 'zAccordionContent',
})
export class ZardAccordionContentComponent {
  private readonly item = inject(ZardAccordionItemComponent, {
    optional: true,
  });

  readonly class = input<ClassValue>('');

  readonly open = computed(() => this.item?.open() ?? false);

  protected readonly classes = computed(() =>
    mergeClasses(accordionContentVariants(), this.class())
  );
}
