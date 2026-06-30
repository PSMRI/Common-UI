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
  radioGroupVariants,
  type ZardRadioGroupVariants,
} from './radio-group.variants';

type OnTouchedType = () => unknown;
type OnChangeType = (value: unknown) => void;

let uniqueGroupId = 0;

/**
 * Radio group: owns the selected value (and the form binding via
 * ControlValueAccessor) and coordinates the `z-radio` items projected into
 * it. Each child radio reads `value()` for its checked state and calls
 * `select()` when chosen, so a single `formControlName` on the group drives
 * the whole set — the shadcn RadioGroup + RadioGroupItem pattern.
 */
@Component({
  selector: 'z-radio-group, [z-radio-group]',
  template: `<ng-content />`,
  host: {
    role: 'radiogroup',
    '[class]': 'classes()',
    '[attr.aria-orientation]': 'zOrientation()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardRadioGroupComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zRadioGroup',
})
export class ZardRadioGroupComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly class = input<ClassValue>('');
  readonly zOrientation =
    input<ZardRadioGroupVariants['zOrientation']>('vertical');
  readonly name = input<string>(`z-radio-group-${uniqueGroupId++}`);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly zChange = output<unknown>();

  /** Currently selected value; read by the child radios for `checked`. */
  readonly value = signal<unknown>(null);

  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly classes = computed(() =>
    mergeClasses(
      radioGroupVariants({ zOrientation: this.zOrientation() }),
      this.class()
    )
  );

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: OnChangeType = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: OnTouchedType = () => {};

  /** Called by a child radio when picked. */
  select(value: unknown): void {
    if (this.isDisabled()) return;
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
    this.zChange.emit(value);
  }

  isSelected(value: unknown): boolean {
    return this.value() === value;
  }

  /** Called by a child radio on blur so the control is marked touched even
   * when selection didn't change. */
  markAsTouched(): void {
    this.onTouched();
  }

  writeValue(value: unknown): void {
    this.value.set(value);
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
