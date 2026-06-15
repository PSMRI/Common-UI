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
  computed,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import type { ClassValue } from 'clsx';

import { mergeClasses, noopFn } from '../utils/merge-classes';

import {
  inputVariants,
  type ZardInputSizeVariants,
  type ZardInputStatusVariants,
  type ZardInputTypeVariants,
} from './input.variants';

type OnTouchedType = () => void;
type ZardInputElement = HTMLInputElement | HTMLTextAreaElement;
type ZardInputValue = string | number | null | undefined;
type OnChangeType = (value: ZardInputValue) => void;

@Directive({
  selector: 'input[z-input], textarea[z-input]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardInputDirective),
      multi: true,
    },
  ],
  host: {
    '[class]': 'classes()',
    '(input)': 'updateValue($event.target)',
    '(blur)': 'onBlur()',
  },
  exportAs: 'zInput',
})
export class ZardInputDirective implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<ZardInputElement>>(ElementRef);
  private onTouched: OnTouchedType = noopFn;
  private onChangeFn: OnChangeType = noopFn;

  readonly class = input<ClassValue>('');
  readonly zBorderless = input(false, { transform: booleanAttribute });
  readonly zSize = input<ZardInputSizeVariants>('default');
  readonly zStatus = input<ZardInputStatusVariants>();
  readonly value = model<ZardInputValue>(null);

  readonly size = linkedSignal<ZardInputSizeVariants>(() => this.zSize());

  protected readonly classes = computed(() =>
    mergeClasses(
      inputVariants({
        zType: this.getType(),
        zSize: this.size(),
        zStatus: this.zStatus(),
        zBorderless: this.zBorderless(),
      }),
      this.class(),
    ),
  );

  constructor() {
    effect(() => {
      this.writeNativeValue(this.value());
    });
  }

  disable(b: boolean): void {
    this.elementRef.nativeElement.disabled = b;
  }

  setDataSlot(name: string): void {
    if (this.elementRef?.nativeElement?.dataset) {
      this.elementRef.nativeElement.dataset['slot'] = name;
    }
  }

  protected updateValue(target: EventTarget | null): void {
    const el = target as ZardInputElement | null;
    this.value.set(this.readNativeValue(el));
    this.onChangeFn(this.value());
  }

  protected onBlur() {
    this.onTouched();
  }

  getType(): ZardInputTypeVariants {
    const isTextarea = this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea';
    return isTextarea ? 'textarea' : 'default';
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disable(isDisabled);
  }

  writeValue(value: ZardInputValue): void {
    const newValue = value ?? '';
    this.value.set(newValue);
  }

  private isNumericInput(element: ZardInputElement): element is HTMLInputElement {
    return element.tagName.toLowerCase() === 'input' && ['number', 'range'].includes(element.type);
  }

  private readNativeValue(element: ZardInputElement | null): ZardInputValue {
    if (!element) {
      return '';
    }

    if (this.isNumericInput(element)) {
      const currentValue = this.value();

      if (typeof currentValue === 'number' || currentValue === null) {
        if (element.value === '') {
          return null;
        }

        const numericValue = element.valueAsNumber;
        return Number.isNaN(numericValue) ? null : numericValue;
      }
    }

    return element.value;
  }

  private writeNativeValue(value: ZardInputValue): void {
    const element = this.elementRef.nativeElement;

    if (this.isNumericInput(element) && typeof value === 'number') {
      element.value = Number.isNaN(value) ? '' : String(value);
      return;
    }

    element.value = String(value ?? '');
  }
}
