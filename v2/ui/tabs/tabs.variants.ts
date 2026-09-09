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

import type { zAlign } from './tabs.component';

export const tabContainerVariants = cva('flex', {
  variants: {
    zPosition: {
      top: 'flex-col',
      bottom: 'flex-col',
      left: 'flex-row',
      right: 'flex-row',
    },
  },
  defaultVariants: {
    zPosition: 'top',
  },
});

export const tabNavVariants = cva(
  'inline-flex w-fit items-center overflow-auto rounded-lg bg-muted p-[3px] text-muted-foreground',
  {
  variants: {
    zPosition: {
      top: 'flex-row mb-4',
      bottom: 'flex-row mt-4',
      left: 'flex-col mr-4 min-h-0',
      right: 'flex-col ml-4 min-h-0',
    },
    zAlignTabs: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    zPosition: 'top',
    zAlignTabs: 'start',
  },
});

export const tabButtonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium transition-[color,box-shadow]',
  {
  variants: {
    zActivePosition: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    isActive: {
      // Active = primary-tinted pill + soft shadow on the muted track
      // (segmented tabs, no divider). Keep the fill on hover so it
      // doesn't flip back to the ghost button's built-in hover:bg-muted.
      true: 'bg-primary/10 text-foreground shadow-sm hover:bg-primary/10!',
      false: 'text-muted-foreground hover:text-foreground',
    },
  },
  defaultVariants: {
    zActivePosition: 'bottom',
    isActive: false,
  },
});

export type ZardTabVariants = VariantProps<typeof tabContainerVariants> &
  VariantProps<typeof tabNavVariants> &
  VariantProps<typeof tabButtonVariants> & { zAlignTabs: zAlign };
