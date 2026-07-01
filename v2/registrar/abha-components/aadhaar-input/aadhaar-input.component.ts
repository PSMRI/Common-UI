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
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';

@Component({
  selector: 'app-aadhaar-input',
  templateUrl: './aadhaar-input.component.html',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, NgIcon, ZardFormImports, ZardInputDirective],
  viewProviders: [provideIcons({ lucideEye, lucideEyeOff })],
})
export class AadhaarInputComponent {
  /** FormGroup that owns the `part1`, `part2` and `part3` controls. */
  @Input({ required: true }) formGroup!: FormGroup;
  /** Label rendered above the three input parts. */
  @Input() label = '';
  /** Whether the current value is invalid (drives the error message). */
  @Input() invalid: boolean | undefined = false;
  /** Error message shown when `invalid` is true. */
  @Input() invalidText = 'Please enter a valid Aadhaar number';

  inputType: string = 'password';

  moveToNext(event: any, nextElement: any) {
    if (event.target.value.length === 4) {
      nextElement.focus();
    }
  }

  moveToPrev(event: any, prevElement: any) {
    if (event.target.value.length === 0) {
      prevElement.focus();
    }
  }

  toggleVisibility() {
    this.inputType = this.inputType === 'password' ? 'text' : 'password';
  }
}
