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

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
  type TemplateRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { ZardButtonComponent, type ZardButtonTypeVariants } from '../button';
import { ZardCalendarComponent } from '../calendar';
import type { ZardDatePickerSizeVariants } from './date-picker.variants';
import { ZardPopoverComponent, ZardPopoverDirective } from '../popover';
import { mergeClasses, noopFn } from '../utils/merge-classes';

/**
 * Height overrides for date-picker sizes.
 *
 * These heights intentionally differ from button size variants to accommodate
 * the date-picker UI:
 * - default: h-9 (vs button h-8)
 * - lg: h-11 (vs button h-9)
 *
 * The `mergeClasses` utility (tailwind-merge) resolves class conflicts,
 * allowing these values to override the base button heights defined in
 * `ZardDatePickerSizeVariants`.
 */
const HEIGHT_BY_SIZE: Record<ZardDatePickerSizeVariants, string> = {
  xs: 'h-7',
  sm: 'h-8',
  default: 'h-9',
  lg: 'h-11',
};

@Component({
  selector: 'z-date-picker, [z-date-picker]',
  imports: [ZardButtonComponent, ZardCalendarComponent, ZardPopoverComponent, ZardPopoverDirective, NgIcon],
  viewProviders: [provideIcons({ lucideCalendar })],
  template: `
    <button
      z-button
      type="button"
      [zType]="zType()"
      [zSize]="zSize()"
      [disabled]="disabled()"
      [class]="buttonClasses()"
      zPopover
      #popoverDirective="zPopover"
      [zContent]="calendarTemplate"
      zTrigger="click"
      (zVisibleChange)="onPopoverVisibilityChange($event)"
      [attr.aria-expanded]="false"
      [attr.aria-haspopup]="true"
      aria-label="Choose date"
    >
      <ng-icon name="lucideCalendar" />
      <span [class]="textClasses()">
        {{ displayText() }}
      </span>
    </button>

    <ng-template #calendarTemplate>
      <z-popover [class]="popoverClasses()">
        <z-calendar
          #calendar
          class="border-0"
          [value]="value()"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          [disabled]="disabled()"
          (dateChange)="onDateChange($event)"
        />
      </z-popover>
    </ng-template>
  `,
  providers: [
    DatePipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardDatePickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'class()',
  },
  exportAs: 'zDatePicker',
})
export class ZardDatePickerComponent implements ControlValueAccessor {
  private readonly datePipe = inject(DatePipe);

  readonly calendarTemplate = viewChild.required<TemplateRef<unknown>>('calendarTemplate');
  readonly popoverDirective = viewChild.required<ZardPopoverDirective>('popoverDirective');
  readonly calendar = viewChild.required<ZardCalendarComponent>('calendar');

  readonly class = input<ClassValue>('');
  readonly zType = input<ZardButtonTypeVariants>('outline');
  readonly zSize = input<ZardDatePickerSizeVariants>('default');
  readonly value = model<Date | null>(null);
  readonly placeholder = input<string>('Pick a date');
  readonly zFormat = input<string>('MMMM d, yyyy');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabled = model<boolean>(false);

  readonly dateChange = output<Date | null>();

  private onChange: (value: Date | null) => void = noopFn;
  private onTouched: () => void = noopFn;

  protected readonly buttonClasses = computed(() => {
    const hasValue = !!this.value();
    const size = this.zSize();
    const height = HEIGHT_BY_SIZE[size];
    return mergeClasses(
      'justify-start text-left font-normal',
      !hasValue && 'text-muted-foreground',
      height,
      'min-w-[240px]',
    );
  });

  protected readonly textClasses = computed(() => {
    const hasValue = !!this.value();
    return mergeClasses(!hasValue && 'text-muted-foreground');
  });

  protected readonly popoverClasses = computed(() => mergeClasses('w-auto p-0'));

  protected readonly displayText = computed(() => {
    const date = this.value();
    if (!date) {
      return this.placeholder();
    }
    return this.formatDate(date, this.zFormat());
  });

  protected onDateChange(date: Date | Date[]): void {
    // Date picker always uses single mode, so we can safely cast
    const singleDate = Array.isArray(date) ? (date[0] ?? null) : date;
    this.value.set(singleDate);
    this.onChange(singleDate);
    this.onTouched();
    this.dateChange.emit(singleDate);

    this.popoverDirective().hide();
  }

  protected onPopoverVisibilityChange(visible: boolean): void {
    if (visible) {
      setTimeout(() => {
        if (this.calendar()) {
          this.calendar().resetNavigation();
        }
      });
    }
  }

  private formatDate(date: Date, format: string): string {
    return this.datePipe.transform(date, format) ?? '';
  }

  writeValue(value: Date | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
