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
  ChangeDetectorRef,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';

import {
  toggleGroupItemVariants,
  toggleGroupVariants,
} from './toggle-group.variants';

type OnTouchedType = () => unknown;
type OnChangeType = (value: unknown) => void;

export type ZardToggleGroupType = 'single' | 'multiple';

/**
 * Toggle group (segmented buttons): owns the selected value (and the form
 * binding via ControlValueAccessor) and coordinates the
 * `z-toggle-group-item` buttons projected into it. In 'single' mode the value
 * is a single value (or null); in 'multiple' mode it is an array of values.
 * Each child item reads `isSelected()` for its pressed state and calls
 * `toggle()` when clicked — the shadcn ToggleGroup + ToggleGroupItem pattern.
 */
@Component({
  selector: 'z-toggle-group, [z-toggle-group]',
  template: `<ng-content />`,
  host: {
    role: 'group',
    '[class]': 'classes()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardToggleGroupComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zToggleGroup',
})
export class ZardToggleGroupComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly class = input<ClassValue>('');
  readonly zType = input<ZardToggleGroupType>('single');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly zChange = output<unknown>();

  /** Currently selected value(s); read by the child items for `isOn`. */
  readonly value = signal<unknown>(null);

  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly classes = computed(() =>
    mergeClasses(toggleGroupVariants(), this.class())
  );

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: OnChangeType = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: OnTouchedType = () => {};

  /** Called by a child item when clicked. */
  toggle(value: unknown): void {
    if (this.isDisabled()) return;

    let next: unknown;
    if (this.zType() === 'multiple') {
      const current = Array.isArray(this.value())
        ? [...(this.value() as unknown[])]
        : [];
      const index = current.indexOf(value);
      if (index === -1) {
        current.push(value);
      } else {
        current.splice(index, 1);
      }
      next = current;
    } else {
      next = this.value() === value ? null : value;
    }

    this.value.set(next);
    this.onChange(next);
    this.onTouched();
    this.zChange.emit(next);
  }

  isSelected(value: unknown): boolean {
    const current = this.value();
    if (this.zType() === 'multiple') {
      return Array.isArray(current) && current.includes(value);
    }
    return current === value;
  }

  writeValue(value: unknown): void {
    let normalized: unknown;
    if (this.zType() === 'multiple') {
      if (Array.isArray(value)) {
        normalized = value;
      } else if (value === null || value === undefined) {
        normalized = [];
      } else {
        normalized = [value];
      }
    } else {
      if (Array.isArray(value)) {
        normalized = value.length > 0 ? value[0] : null;
      } else {
        normalized = value ?? null;
      }
    }
    this.value.set(normalized);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(disabledState: boolean): void {
    this.formDisabled.set(disabledState);
    this.cdr.markForCheck();
  }
}

/**
 * A single segmented button inside a `z-toggle-group`. Reads/updates the
 * parent group: it reflects the group's selection via `aria-pressed` and
 * `data-state`, and calls `group.toggle(zValue)` when clicked.
 */
@Component({
  selector: 'z-toggle-group-item, [z-toggle-group-item]',
  template: `
    <button
      type="button"
      [class]="classes()"
      [disabled]="isDisabled()"
      [attr.aria-pressed]="isOn()"
      [attr.data-state]="isOn() ? 'on' : 'off'"
      (click)="onClick()">
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zToggleGroupItem',
})
export class ZardToggleGroupItemComponent {
  private readonly group = inject(ZardToggleGroupComponent);

  readonly class = input<ClassValue>('');
  readonly zValue = input.required<unknown>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly isOn = computed(() =>
    this.group.isSelected(this.zValue())
  );
  protected readonly isDisabled = computed(
    () => this.group.isDisabled() || this.disabled()
  );

  protected readonly classes = computed(() =>
    mergeClasses(toggleGroupItemVariants({ isOn: this.isOn() }), this.class())
  );

  protected onClick(): void {
    if (this.isDisabled()) return;
    this.group.toggle(this.zValue());
  }
}
