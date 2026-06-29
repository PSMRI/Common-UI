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

import { ZardIdDirective } from '../directives';
import { mergeClasses } from '../utils/merge-classes';
import { ZardRadioGroupComponent } from '../radio-group/radio-group.component';

import { radioLabelVariants, radioVariants } from './radio.variants';

type OnTouchedType = () => unknown;
type OnChangeType = (value: unknown) => void;

@Component({
  selector: 'z-radio, [z-radio]',
  imports: [ZardIdDirective],
  template: `
    <span
      class="relative flex items-center gap-2"
      [class]="isDisabled() ? 'cursor-not-allowed' : 'cursor-pointer'"
      zardId="radio"
      #z="zardId">
      <input
        #input
        type="radio"
        [value]="value()"
        [class]="classes()"
        [checked]="isChecked()"
        [disabled]="isDisabled()"
        (change)="onRadioChange()"
        (blur)="onRadioBlur()"
        [name]="resolvedName()"
        [id]="zId() || z.id()" />
      <span
        class="bg-primary pointer-events-none absolute left-1 size-2 rounded-full opacity-0 peer-checked:opacity-100"></span>
      <label [class]="labelClasses()" [for]="zId() || z.id()">
        <ng-content />
      </label>
    </span>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardRadioComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zRadio',
})
export class ZardRadioComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  // Optional parent group: when present it owns the selected value and the
  // form binding, and this radio reflects/updates it instead of its own CVA.
  private readonly group = inject(ZardRadioGroupComponent, { optional: true });

  readonly radioChange = output<boolean>();
  readonly class = input<ClassValue>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>('radio');
  readonly value = input<unknown>(null);
  readonly zId = input<string>('');

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: OnChangeType = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: OnTouchedType = () => {};

  protected readonly classes = computed(() =>
    mergeClasses(radioVariants(), this.class())
  );
  protected readonly labelClasses = computed(() =>
    mergeClasses(radioLabelVariants())
  );

  // Form-driven disabled state (FormControl.disable()), combined with the input.
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(
    () => this.group?.isDisabled() || this.disabled() || this.formDisabled()
  );

  // Checked state: from the parent group when grouped, else from this radio's
  // own CVA value (standalone use).
  private readonly standaloneChecked = signal(false);
  protected readonly isChecked = computed(() =>
    this.group ? this.group.isSelected(this.value()) : this.standaloneChecked()
  );
  // Grouped radios share the group's name so the browser treats them as one set.
  protected readonly resolvedName = computed(
    () => this.group?.name() ?? this.name()
  );

  writeValue(val: unknown): void {
    this.standaloneChecked.set(val === this.value());
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

  onRadioBlur(): void {
    this.onTouched();
    this.cdr.markForCheck();
  }

  onRadioChange(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.group) {
      this.group.select(this.value());
    } else {
      this.standaloneChecked.set(true);
      this.onChange(this.value());
    }
    this.radioChange.emit(true);
    this.cdr.markForCheck();
  }
}
