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

export const accordionVariants = cva('block');

export const accordionItemVariants = cva('border-b');

export const accordionTriggerVariants = cva(
  'flex flex-1 w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'
);

export const accordionChevronVariants = cva(
  'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
  {
    variants: {
      open: {
        true: 'rotate-180',
        false: '',
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

export const accordionContentVariants = cva(
  'grid text-sm transition-all duration-200'
);

export type ZardAccordionTriggerVariants = VariantProps<
  typeof accordionTriggerVariants
>;
export type ZardAccordionChevronVariants = VariantProps<
  typeof accordionChevronVariants
>;
