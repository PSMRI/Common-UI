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

export const toggleGroupVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-lg'
);

export const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center rounded-md px-3 h-9 text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      isOn: {
        true: 'bg-accent text-accent-foreground',
      },
    },
  }
);

export type ZardToggleGroupVariants = VariantProps<typeof toggleGroupVariants>;
export type ZardToggleGroupItemVariants = VariantProps<
  typeof toggleGroupItemVariants
>;
