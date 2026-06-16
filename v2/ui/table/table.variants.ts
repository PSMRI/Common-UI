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

export const tableVariants = cva(
  'w-full caption-bottom text-sm [&_thead_tr]:border-b [&_tbody]:border-0 [&_tbody_tr:last-child]:border-0 [&_tbody_tr]:border-b [&_tbody_tr]:transition-colors [&_tbody_tr]:hover:bg-muted/50 [&_tbody_tr]:data-[state=selected]:bg-muted [&_th]:h-10 [&_th]:px-2 [&_th]:text-left [&_th]:align-middle [&_th]:font-medium [&_th]:text-muted-foreground [&_th:has([role=checkbox])]:pr-0 [&_th>[role=checkbox]]:translate-y-0.5 [&_td]:p-2 [&_td]:align-middle [&_td:has([role=checkbox])]:pr-0 [&_td>[role=checkbox]]:translate-y-0.5 [&_caption]:mt-4 [&_caption]:text-sm [&_caption]:text-muted-foreground',
  {
    variants: {
      zType: {
        default: '',
        striped: '[&_tbody_tr:nth-child(odd)]:bg-muted/50',
        bordered: 'border border-border',
      },
      zSize: {
        default: '',
        compact: '[&_td]:py-2 [&_th]:py-2',
        comfortable: '[&_td]:py-4 [&_th]:py-4',
      },
    },
    defaultVariants: {
      zType: 'default',
      zSize: 'default',
    },
  },
);

export const tableHeaderVariants = cva('[&_tr]:border-b', {
  variants: {},
  defaultVariants: {},
});

export const tableBodyVariants = cva('[&_tr:last-child]:border-0', {
  variants: {},
  defaultVariants: {},
});

export const tableRowVariants = cva('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', {
  variants: {},
  defaultVariants: {},
});

export const tableHeadVariants = cva(
  'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
  {
    variants: {},
    defaultVariants: {},
  },
);

export const tableCellVariants = cva(
  'p-2 align-middle [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
  {
    variants: {},
    defaultVariants: {},
  },
);

export const tableCaptionVariants = cva('mt-4 text-sm text-muted-foreground', {
  variants: {},
  defaultVariants: {},
});

export type ZardTableSizeVariants = NonNullable<VariantProps<typeof tableVariants>['zSize']>;
export type ZardTableTypeVariants = NonNullable<VariantProps<typeof tableVariants>['zType']>;
