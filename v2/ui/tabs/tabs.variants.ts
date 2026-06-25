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

export const tabNavVariants = cva('flex gap-4 overflow-auto', {
  variants: {
    zPosition: {
      top: 'flex-row border-b mb-4',
      bottom: 'flex-row border-t mt-4',
      left: 'flex-col border-r mr-4 min-h-0',
      right: 'flex-col border-l ml-4 min-h-0',
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

export const tabButtonVariants = cva('hover:bg-transparent rounded-none shrink-0', {
  variants: {
    zActivePosition: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    isActive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      zActivePosition: 'top',
      isActive: true,
      class: 'border-t-2 border-t-primary',
    },
    {
      zActivePosition: 'bottom',
      isActive: true,
      class: 'border-b-2 border-b-primary',
    },
    {
      zActivePosition: 'left',
      isActive: true,
      class: 'border-l-2 border-l-primary',
    },
    {
      zActivePosition: 'right',
      isActive: true,
      class: 'border-r-2 border-r-primary',
    },
  ],
  defaultVariants: {
    zActivePosition: 'bottom',
    isActive: false,
  },
});

export type ZardTabVariants = VariantProps<typeof tabContainerVariants> &
  VariantProps<typeof tabNavVariants> &
  VariantProps<typeof tabButtonVariants> & { zAlignTabs: zAlign };
