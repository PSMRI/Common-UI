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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { SessionStorageService } from '../../services/session-storage.service';
import { ZardCheckboxComponent } from 'Common-UI/v2/ui/checkbox';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';

@Component({
  selector: 'app-abha-consent-form',
  templateUrl: './abha-consent-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgIcon,
    ZardCheckboxComponent,
    ZardButtonComponent,
  ],
  viewProviders: [provideIcons({ lucideX })],
})
export class AbhaConsentFormComponent {
  // Define the checkboxes as FormControl for handling the checkbox logic
  consent = new FormControl(false);
  consent1 = new FormControl(false); // Initially unchecked
  consent2 = new FormControl(false);
  consent3 = new FormControl(false);
  consent4 = new FormControl(false);
  consent5 = new FormControl(false);
  consent5one = new FormControl(false);
  consent5two = new FormControl(false);
  userName = this.sessionstorage.getItem('userName');

  constructor(
    public dialogRef: MatDialogRef<AbhaConsentFormComponent>,
    private sessionstorage: SessionStorageService,
  ) {}

  // Function to close the dialog
  closeDialog() {
    this.dialogRef.close(false);
  }

  checkAll() {
    if (this.consent.value) {
      this.consent1.setValue(true);
      this.consent2.setValue(true);
      this.consent3.setValue(true);
      this.consent4.setValue(true);
      this.consent5.setValue(true);
      this.consent5one.setValue(true);
      this.consent5two.setValue(true);
    }
  }

  // Function to check if all checkboxes are checked
  allConsentsChecked() {
    return (
      this.consent1.value &&
      this.consent4.value &&
      this.consent5.value &&
      (this.consent5one.value || this.consent5two.value)
    );
  }

  checkBenConsent() {
    if (this.consent5.value) {
      this.consent5one.setValue(true);
      this.consent5two.setValue(true);
    } else {
      this.consent5one.setValue(false);
      this.consent5two.setValue(false);
    }
  }

  checkBenDoubleConsent() {
    if (this.consent5one.value || this.consent5two.value) {
      this.consent5.setValue(true);
    }
  }

  submitConsent() {
    if (this.allConsentsChecked()) {
      console.log('Consent Submitted Successfully!');
      this.dialogRef.close(true);
    } else {
      console.log('Please review and accept all consents.');
      this.dialogRef.close(false);
    }
  }
}
