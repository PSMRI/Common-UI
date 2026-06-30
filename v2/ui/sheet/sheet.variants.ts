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

export const sheetVariants = cva(
  'fixed z-50 bg-background p-6 shadow-lg flex flex-col gap-4 transition-transform duration-300 ease-in-out',
  {
    variants: {
      zSide: {
        right: 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l',
        left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r',
        top: 'inset-x-0 top-0 h-auto w-full border-b',
        bottom: 'inset-x-0 bottom-0 h-auto w-full border-t',
      },
    },
    defaultVariants: {
      zSide: 'right',
    },
  }
);
export type ZardSheetVariants = VariantProps<typeof sheetVariants>;

/**
 * Closed-state transform per side: panel is translated fully off-screen so the
 * `transition-transform` on the panel produces a slide-in/out effect.
 */
export const sheetClosedTransform = cva('', {
  variants: {
    zSide: {
      right: 'translate-x-full',
      left: '-translate-x-full',
      top: '-translate-y-full',
      bottom: 'translate-y-full',
    },
  },
  defaultVariants: {
    zSide: 'right',
  },
});

/**
 * Open-state transform per side: panel is slid into place along the relevant
 * axis, complementing {@link sheetClosedTransform} so the slide animates.
 */
export const sheetOpenTransform = cva('', {
  variants: {
    zSide: {
      right: 'translate-x-0',
      left: 'translate-x-0',
      top: 'translate-y-0',
      bottom: 'translate-y-0',
    },
  },
  defaultVariants: {
    zSide: 'right',
  },
});
