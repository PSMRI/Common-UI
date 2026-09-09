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

export const paginationContentVariants = cva('flex list-none flex-row items-center gap-1 p-0');
export type ZardPaginationContentVariants = VariantProps<typeof paginationContentVariants>;

export const paginationPreviousVariants = cva('gap-1 px-2.5 sm:pl-2.5');
export type ZardPaginationPreviousVariants = VariantProps<typeof paginationPreviousVariants>;

export const paginationNextVariants = cva('gap-1 px-2.5 sm:pr-2.5');
export type ZardPaginationNextVariants = VariantProps<typeof paginationNextVariants>;

export const paginationEllipsisVariants = cva('flex size-9 items-center justify-center');
export type ZardPaginationEllipsisVariants = VariantProps<typeof paginationEllipsisVariants>;

export const paginationVariants = cva('mx-auto flex w-full justify-center');
export type ZardPaginationVariants = VariantProps<typeof paginationVariants>;
