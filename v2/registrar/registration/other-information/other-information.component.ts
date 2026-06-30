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
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RegistrarService } from '../../services/registrar.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConsentFormComponent } from '../consent-form/consent-form.component';
import { NgFor, NgIf } from '@angular/common';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { ZardRadioComponent } from 'Common-UI/v2/ui/radio';
import { ZardRadioGroupComponent } from 'Common-UI/v2/ui/radio-group';
import { ZardDatePickerComponent } from 'Common-UI/v2/ui/date-picker';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgFor,
    NgIf,
    ZardFormImports,
    ZardInputDirective,
    ZardSelectImports,
    ZardRadioComponent,
    ZardRadioGroupComponent,
    ZardDatePickerComponent,
  ],
})
export class OtherInformationComponent {
  @Input('otherInfoFormGroup')
  otherInfoFormGroup!: FormGroup;

  @Input('formData')
  formData: any;

  @Input()
  patientRevisit = false;

  @Input()
  revisitData: any;
  otherInfoSubscription!: Subscription;
  consentGranted: any;

  constructor(
    private fb: FormBuilder,
    private registrarService: RegistrarService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    console.log('this.otherInfoSubscription', this.otherInfoSubscription);
    this.formData.forEach((item: any) => {
      if (item.fieldName && item.allowText) {
        this.otherInfoFormGroup.addControl(
          item.fieldName,
          new FormControl(null, [
            Validators.pattern(this.allowTextValidator(item.allowText)),
            Validators.minLength(parseInt(item?.allowMin)),
            Validators.maxLength(parseInt(item?.allowMax)),
          ]),
        );
      } else {
        this.otherInfoFormGroup.addControl(
          item.fieldName,
          new FormControl(null),
        );
      }
    });
    console.log('otherInfoFormGroup Data', this.otherInfoFormGroup);
    if (this.patientRevisit)
      this.otherInfoFormGroup.patchValue(this.revisitData);
    console.log('other Form Data', this.formData);
  }

  allowTextValidator(allowText: any) {
    let regex: RegExp;

    switch (allowText) {
      case 'alpha':
        regex = /^[a-zA-Z]*$/;
        break;
      case 'numeric':
        regex = /^[0-9]*$/;
        break;
      case 'alphaNumeric':
        regex = /^[a-zA-Z0-9]*$/;
        break;
      case 'alphaWithSpace':
        regex = /^[a-zA-Z ]*$/;
        break;
      default:
        regex = /^[a-zA-Z0-9 ]*$/;
        break;
    }

    return regex;
  }

  onInputChanged(event: Event, maxLength: any, fieldName: any) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value;

    if (maxLength && inputValue.length >= parseInt(maxLength)) {
      // Add 'A' character when the input length exceeds the limit
      inputElement.value = inputValue.slice(0, maxLength);
      this.otherInfoFormGroup.controls[fieldName].patchValue(
        inputElement.value,
      );
      const currentErrors = this.otherInfoFormGroup.controls[fieldName].errors;
      if (currentErrors && currentErrors['maxlength']) {
        delete currentErrors['maxlength'];
      }
    }
  }

  ngOnDestroy() {
    if (this.otherInfoSubscription) {
      this.otherInfoSubscription.unsubscribe();
    }
  }

  openConsent() {
    if (this.patientRevisit === false) {
      const matDialogRef: MatDialogRef<ConsentFormComponent> = this.dialog.open(
        ConsentFormComponent,
        {
          width: '650px',
          height: '700px',
          disableClose: true,
        },
      );
      matDialogRef.afterClosed().subscribe((consentProvided) => {
        this.consentGranted = consentProvided;
        this.registrarService.sendConsentStatus(consentProvided);
      });
    }
  }
}
