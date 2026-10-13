/*
 * AMRIT – Accessible Medical Records via Integrated Technology
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

import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { sortPurposes } from '../consent-draft';
import { Purpose } from '../consent.models';

/** Purpose switches shared by both tracks: mandatory first, all off at start (FR-006). */
@Directive()
export abstract class PurposesStepBase {
  @Input() text: any;
  @Input() decisions: { [purposeCode: string]: boolean } = {};
  @Output() decisionsChange = new EventEmitter<{ [purposeCode: string]: boolean }>();

  sorted: Purpose[] = [];

  @Input() set purposes(value: Purpose[]) {
    this.sorted = sortPurposes(value || []);
  }

  isOn(purposeCode: string): boolean {
    return this.decisions[purposeCode] === true;
  }

  toggle(purposeCode: string, checked: boolean): void {
    this.decisionsChange.emit({ ...this.decisions, [purposeCode]: checked });
  }
}
