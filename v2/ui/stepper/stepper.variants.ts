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

import { cva, type VariantProps } from 'class-variance-authority';

export const stepperVariants = cva('flex w-full items-center');

export const stepVariants = cva('flex items-center', {
  variants: {
    zState: {
      completed: '',
      active: '',
      upcoming: '',
    },
    // Non-last steps grow so their trailing connector line fills the gap;
    // the last step hugs its content so it sits flush at the end.
    zLast: {
      true: 'shrink-0',
      false: 'flex-1',
    },
  },
  defaultVariants: {
    zState: 'upcoming',
    zLast: false,
  },
});

export const stepIndicatorVariants = cva(
  'flex size-8 items-center justify-center rounded-full border text-sm font-medium transition-colors',
  {
    variants: {
      zState: {
        completed: 'bg-primary text-primary-foreground border-primary',
        active: 'border-primary text-primary',
        upcoming: 'border-input text-muted-foreground',
      },
    },
    defaultVariants: {
      zState: 'upcoming',
    },
  }
);

export const stepLabelVariants = cva('ml-2 text-sm', {
  variants: {
    zState: {
      completed: 'text-foreground',
      active: 'text-foreground',
      upcoming: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    zState: 'upcoming',
  },
});

export const stepConnectorVariants = cva('mx-2 h-px flex-1', {
  variants: {
    zCompleted: {
      true: 'bg-primary',
      false: 'bg-border',
    },
  },
  defaultVariants: {
    zCompleted: false,
  },
});

export type ZardStepState = 'completed' | 'active' | 'upcoming';
export type ZardStepVariants = VariantProps<typeof stepVariants>;
