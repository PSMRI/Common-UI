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
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../utils/merge-classes';
import {
  stepConnectorVariants,
  stepIndicatorVariants,
  stepLabelVariants,
  stepperVariants,
  stepVariants,
  type ZardStepState,
} from './stepper.variants';

@Component({
  selector: 'z-stepper, [z-stepper]',
  exportAs: 'zStepper',
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()', role: 'list' },
})
export class ZardStepperComponent {
  // 0-based index of the currently active step.
  readonly zActiveIndex = input<number>(0);
  readonly class = input<ClassValue>('');

  // Steps register themselves via projection; this gives their document order,
  // which a step uses to resolve its own index (see ZardStepComponent.index()).
  readonly steps = contentChildren(ZardStepComponent);

  // The raw zActiveIndex may be out of bounds (e.g. -1 or >= length). Clamp it
  // into a valid range so exactly one step is "active" — an out-of-range value
  // would otherwise make every step upcoming (-1) or completed (>= length).
  // Guard for an empty stepper so the lower bound never goes negative.
  readonly activeIndex = computed(() =>
    Math.max(0, Math.min(this.zActiveIndex(), this.steps().length - 1))
  );

  protected readonly classes = computed(() =>
    mergeClasses(stepperVariants(), this.class())
  );
}

@Component({
  selector: 'z-step, [z-step]',
  exportAs: 'zStep',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideCheck })],
  template: `
    <span [class]="indicatorClasses()" aria-hidden="true">
      @if (state() === 'completed') {
        <ng-icon name="lucideCheck" />
      } @else {
        {{ index() + 1 }}
      }
    </span>

    @if (zLabel()) {
      <span [class]="labelClasses()" aria-hidden="true">{{ zLabel() }}</span>
    }

    <span class="sr-only">{{ a11yLabel() }}</span>

    @if (!isLast()) {
      <span [class]="connectorClasses()" aria-hidden="true"></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    role: 'listitem',
    '[attr.aria-current]': "state() === 'active' ? 'step' : null",
  },
})
export class ZardStepComponent {
  // The parent stepper owns the active index and the ordered list of steps.
  private readonly stepper = inject(ZardStepperComponent);

  readonly zLabel = input<string>('');
  readonly class = input<ClassValue>('');

  // Resolve this step's position from the parent's projected-children order —
  // same approach as tabs.component.ts (tabs()[index]); here we look ourselves
  // up with indexOf(this) so each step knows where it sits.
  protected readonly index = computed(() => this.stepper.steps().indexOf(this));

  protected readonly state = computed<ZardStepState>(() => {
    // Use the parent's clamped active index so an out-of-range zActiveIndex
    // can't make every step upcoming/completed.
    const active = this.stepper.activeIndex();
    const index = this.index();
    if (index < active) {
      return 'completed';
    }
    if (index === active) {
      return 'active';
    }
    return 'upcoming';
  });

  // Visually-hidden status announced to screen readers, e.g.
  // "Step 2: Vitals — current". The visible indicator/label are aria-hidden.
  private readonly stateText: Record<ZardStepState, string> = {
    completed: 'completed',
    active: 'current',
    upcoming: 'upcoming',
  };

  protected readonly a11yLabel = computed(() => {
    const label = this.zLabel();
    return `Step ${this.index() + 1}${label ? ': ' + label : ''} — ${this.stateText[this.state()]}`;
  });

  protected readonly isLast = computed(
    () => this.index() === this.stepper.steps().length - 1
  );

  protected readonly classes = computed(() =>
    mergeClasses(
      stepVariants({ zState: this.state(), zLast: this.isLast() }),
      this.class()
    )
  );
  protected readonly indicatorClasses = computed(() =>
    mergeClasses(stepIndicatorVariants({ zState: this.state() }))
  );
  protected readonly labelClasses = computed(() =>
    mergeClasses(stepLabelVariants({ zState: this.state() }))
  );
  protected readonly connectorClasses = computed(() =>
    mergeClasses(
      stepConnectorVariants({ zCompleted: this.state() === 'completed' })
    )
  );
}
