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
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideMinus } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { ZardIdDirective } from '../directives';
import { mergeClasses } from '../utils/merge-classes';

import { checkboxLabelVariants, checkboxVariants } from './checkbox.variants';

type OnTouchedType = () => unknown;
type OnChangeType = (value: boolean) => void;

@Component({
  selector: 'z-checkbox, [z-checkbox]',
  imports: [NgIcon, ZardIdDirective],
  template: `
    <span
      class="relative inline-flex items-center gap-2"
      [class]="isDisabled() ? 'cursor-not-allowed' : 'cursor-pointer'"
      zardId="checkbox"
      #z="zardId"
    >
      <span class="relative inline-flex size-4 shrink-0 items-center justify-center">
        <input
          #input
          type="checkbox"
          [class]="classes()"
          [checked]="zChecked()"
          [indeterminate]="zIndeterminate()"
          [disabled]="isDisabled()"
          [name]="name()"
          [id]="zId() || z.id()"
          [attr.aria-checked]="ariaChecked()"
          [attr.aria-disabled]="isDisabled() ? 'true' : null"
          (change)="onCheckboxChange($event)"
          (blur)="onCheckboxBlur()"
        />
        @if (zIndeterminate()) {
          <ng-icon
            name="lucideMinus"
            size="0.75rem"
            class="text-primary-foreground pointer-events-none relative"
            aria-hidden="true"
          />
        } @else if (zChecked()) {
          <ng-icon
            name="lucideCheck"
            size="0.75rem"
            class="text-primary-foreground pointer-events-none relative"
            aria-hidden="true"
          />
        }
      </span>
      <label [class]="labelClasses()" [for]="zId() || z.id()">
        <ng-content />
      </label>
    </span>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardCheckboxComponent),
      multi: true,
    },
  ],
  viewProviders: [provideIcons({ lucideCheck, lucideMinus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zCheckbox',
})
export class ZardCheckboxComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly zCheckedChange = output<boolean>();
  readonly class = input<ClassValue>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>('checkbox');
  readonly zId = input<string>('');

  // Two-way bindable checked / indeterminate state.
  readonly zChecked = model(false);
  readonly zIndeterminate = model(false);

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: OnChangeType = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: OnTouchedType = () => {};

  protected readonly classes = computed(() => mergeClasses(checkboxVariants(), this.class()));
  protected readonly labelClasses = computed(() =>
    mergeClasses(checkboxLabelVariants(), this.isDisabled() ? 'opacity-50' : ''),
  );

  // Form-driven disabled state (FormControl.disable()), combined with the input.
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  // Reflect the visual state to assistive technology: an indeterminate
  // checkbox is exposed as "mixed" per the WAI-ARIA spec.
  protected readonly ariaChecked = computed(() =>
    this.zIndeterminate() ? 'mixed' : this.zChecked() ? 'true' : 'false',
  );

  writeValue(val: unknown): void {
    // A concrete form value resolves any prior indeterminate state, otherwise a
    // checked value could keep rendering the "mixed" (minus) icon.
    this.zIndeterminate.set(false);
    this.zChecked.set(!!val);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(disabledState: boolean): void {
    // Called by Angular forms (e.g. FormControl.disable()); combined with the
    // disabled() input via the isDisabled computed.
    this.formDisabled.set(disabledState);
    this.cdr.markForCheck();
  }

  onCheckboxBlur(): void {
    this.onTouched();
    this.cdr.markForCheck();
  }

  onCheckboxChange(event: Event): void {
    if (this.isDisabled()) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    // Any user interaction resolves the indeterminate state.
    this.zIndeterminate.set(false);
    this.zChecked.set(checked);
    this.onChange(checked);
    this.zCheckedChange.emit(checked);
    this.cdr.markForCheck();
  }
}
