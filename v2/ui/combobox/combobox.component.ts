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
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideSearch } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { ZardInputDirective } from '../input';
import { mergeClasses } from '../utils/merge-classes';

import {
  comboboxContentVariants,
  comboboxItemIconVariants,
  comboboxItemVariants,
  comboboxVariants,
} from './combobox.variants';

type OnTouchedType = () => void;
type OnChangeType = (value: unknown) => void;

// Per-instance id counter so multiple comboboxes on one page don't collide.
let nextId = 0;

export type ZardComboboxOption = string | Record<string, unknown>;

@Component({
  selector: 'z-combobox, [z-combobox]',
  imports: [NgIcon, ZardInputDirective],
  template: `
    <div class="relative">
      <ng-icon
        name="lucideSearch"
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        size="16px"
        aria-hidden="true" />
      <input
        #input
        z-input
        type="text"
        role="combobox"
        autocomplete="off"
        class="pl-9"
        [value]="query()"
        [disabled]="isDisabled()"
        [placeholder]="zPlaceholder()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="isOpen() ? listboxId : null"
        [attr.aria-activedescendant]="activeDescendantId()"
        aria-autocomplete="list"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)" />
    </div>

    @if (isOpen()) {
      <div [id]="listboxId" role="listbox" [class]="contentClasses()">
        @for (option of filtered(); track labelOf(option); let i = $index) {
          <div
            role="option"
            [id]="optionId(i)"
            [attr.aria-selected]="isSelected(option)"
            [class]="itemClasses(i)"
            (mousedown)="onOptionMousedown($event, option)"
            (mouseenter)="highlightedIndex.set(i)">
            <span [class]="iconClasses()">
              @if (isSelected(option)) {
                <ng-icon name="lucideCheck" aria-hidden="true" />
              }
            </span>
            <span class="min-w-0 flex-1 truncate">{{ labelOf(option) }}</span>
          </div>
        } @empty {
          <div class="text-muted-foreground px-2 py-1.5 text-sm">
            No results found.
          </div>
        }
      </div>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZardComboboxComponent),
      multi: true,
    },
  ],
  viewProviders: [provideIcons({ lucideSearch, lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'zCombobox',
  host: {
    '[class]': 'classes()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ZardComboboxComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Unique per-instance id base so multiple comboboxes on one page don't
  // collide on listbox/option ids (which aria-controls/aria-activedescendant
  // would otherwise resolve to the wrong element).
  private readonly uid = nextId++;
  protected readonly listboxId = `z-combobox-${this.uid}-listbox`;

  readonly class = input<ClassValue>('');
  readonly zOptions = input<ZardComboboxOption[]>([]);
  readonly zLabelKey = input<string>('label');
  readonly zValueKey = input<string>('value');
  readonly zPlaceholder = input<string>('Search...');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly query = signal<string>('');
  protected readonly isOpen = signal<boolean>(false);
  protected readonly highlightedIndex = signal<number>(-1);

  // Form-driven disabled state (FormControl.disable()), combined with the input.
  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled()
  );

  // The currently committed form value (the option's value, not its label).
  private readonly selectedValue = signal<unknown>(null);

  // True while the user is actively typing/editing the input, so the
  // label-resync effect won't clobber in-progress text.
  private readonly isEditing = signal<boolean>(false);

  constructor() {
    // Keep the visible label in sync with the committed value once options
    // resolve. Handles async options that arrive after writeValue() ran:
    // writeValue() can't resolve a label from an empty zOptions(), so this
    // effect fills it in when the matching option appears. Skips while the
    // user is actively editing to avoid overwriting in-progress text.
    effect(() => {
      const value = this.selectedValue();
      const options = this.zOptions() ?? [];
      if (this.isEditing()) {
        return;
      }
      const match = options.find(option => this.valueOf(option) === value);
      this.query.set(match ? this.labelOf(match) : '');
      this.cdr.markForCheck();
    });
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onChange: OnChangeType = () => {};
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private onTouched: OnTouchedType = () => {};

  protected readonly classes = computed(() =>
    mergeClasses(comboboxVariants(), this.class())
  );
  protected readonly contentClasses = computed(() =>
    mergeClasses(comboboxContentVariants())
  );
  protected readonly iconClasses = computed(() =>
    mergeClasses(comboboxItemIconVariants())
  );

  // Filter options by label containing the query (case-insensitive).
  protected readonly filtered = computed<ZardComboboxOption[]>(() => {
    const q = this.query().trim().toLowerCase();
    const options = this.zOptions() ?? [];
    if (!q) {
      return options;
    }
    return options.filter(option =>
      this.labelOf(option).toLowerCase().includes(q)
    );
  });

  protected readonly activeDescendantId = computed<string | null>(() => {
    const index = this.highlightedIndex();
    return this.isOpen() && index >= 0 ? this.optionId(index) : null;
  });

  protected labelOf(option: ZardComboboxOption): string {
    if (option === null || option === undefined) {
      return '';
    }
    if (typeof option === 'string') {
      return option;
    }
    return String(option[this.zLabelKey()] ?? '');
  }

  protected valueOf(option: ZardComboboxOption): unknown {
    if (typeof option === 'string') {
      return option;
    }
    return option[this.zValueKey()];
  }

  protected optionId(index: number): string {
    return `z-combobox-${this.uid}-option-${index}`;
  }

  protected itemClasses(index: number): string {
    return mergeClasses(
      comboboxItemVariants(),
      index === this.highlightedIndex()
        ? 'bg-accent text-accent-foreground'
        : ''
    );
  }

  protected isSelected(option: ZardComboboxOption): boolean {
    return this.valueOf(option) === this.selectedValue();
  }

  protected onInput(event: Event): void {
    if (this.isDisabled()) {
      return;
    }
    const text = (event.target as HTMLInputElement).value;
    this.isEditing.set(true);
    this.query.set(text);
    this.open();
    this.highlightedIndex.set(this.filtered().length ? 0 : -1);

    // If the typed text exactly matches an option label, reflect it as the value.
    const match = (this.zOptions() ?? []).find(
      option => this.labelOf(option) === text
    );
    if (match) {
      this.commit(match, false);
    }
  }

  protected onFocus(): void {
    if (this.isDisabled()) {
      return;
    }
    this.open();
  }

  protected onBlur(): void {
    this.onTouched();
    // Defer so a click on an option (mousedown) commits its selection before
    // we reconcile — otherwise we'd snap back to the old value first.
    setTimeout(() => {
      this.close();
      // Done editing: snap the input text back to the committed option's label
      // (or clear it when nothing is selected), discarding arbitrary typed text.
      this.isEditing.set(false);
      const value = this.selectedValue();
      const match = (this.zOptions() ?? []).find(
        option => this.valueOf(option) === value
      );
      this.query.set(match ? this.labelOf(match) : '');
      this.cdr.markForCheck();
    });
  }

  protected onOptionMousedown(event: Event, option: ZardComboboxOption): void {
    // mousedown (not click) so selection commits before the input's blur fires.
    event.preventDefault();
    this.select(option);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }
    const options = this.filtered();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          return;
        }
        this.moveHighlight(1, options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          return;
        }
        this.moveHighlight(-1, options.length);
        break;
      case 'Enter': {
        if (!this.isOpen()) {
          return;
        }
        event.preventDefault();
        const index = this.highlightedIndex();
        if (index >= 0 && index < options.length) {
          this.select(options[index]);
        }
        break;
      }
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  protected onDocumentClick(event: Event): void {
    if (!this.isOpen()) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private moveHighlight(direction: number, length: number): void {
    if (length === 0) {
      this.highlightedIndex.set(-1);
      return;
    }
    let next = this.highlightedIndex() + direction;
    if (next < 0) {
      next = length - 1;
    } else if (next >= length) {
      next = 0;
    }
    this.highlightedIndex.set(next);
  }

  private select(option: ZardComboboxOption): void {
    this.isEditing.set(false);
    this.query.set(this.labelOf(option));
    this.commit(option, true);
    this.close();
  }

  // Sets the form value to the option's VALUE and notifies the form.
  private commit(option: ZardComboboxOption, emit: boolean): void {
    const value = this.valueOf(option);
    this.selectedValue.set(value);
    if (emit) {
      this.onChange(value);
    }
    this.cdr.markForCheck();
  }

  private open(): void {
    if (this.isOpen()) {
      return;
    }
    this.isOpen.set(true);
    const options = this.filtered();
    const selectedIndex = options.findIndex(option => this.isSelected(option));
    this.highlightedIndex.set(
      selectedIndex >= 0 ? selectedIndex : options.length ? 0 : -1
    );
    this.cdr.markForCheck();
  }

  private close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
    this.cdr.markForCheck();
  }

  // ControlValueAccessor implementation
  writeValue(value: unknown): void {
    // A programmatic write is never "the user editing"; let the resync effect
    // resolve the visible label (handles options that load after this call).
    this.isEditing.set(false);
    this.selectedValue.set(value ?? null);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Called by Angular forms (e.g. FormControl.disable()); combined with the
    // disabled() input via the isDisabled computed.
    this.formDisabled.set(isDisabled);
    this.cdr.markForCheck();
  }
}
