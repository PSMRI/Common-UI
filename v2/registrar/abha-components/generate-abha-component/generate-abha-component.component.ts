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
import { Component, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ZardDialogRef, ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { BiometricAuthenticationComponent } from '../biometric-authentication/biometric-authentication.component';
import { AbhaEnterOtpComponentComponent } from '../abha-enter-otp-component/abha-enter-otp-component.component';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { AbhaMobileComponentComponent } from '../abha-mobile-component/abha-mobile-component.component';
import { NgIf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardRadioGroupComponent } from 'Common-UI/v2/ui/radio-group';
import { ZardRadioComponent } from 'Common-UI/v2/ui/radio';
import { AadhaarInputComponent } from '../aadhaar-input/aadhaar-input.component';

@Component({
  selector: 'app-generate-abha-component',
  templateUrl: './generate-abha-component.component.html',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardFormImports,
    ZardRadioGroupComponent,
    ZardRadioComponent,
    AadhaarInputComponent,
  ],
  viewProviders: [provideIcons({ lucideX })],
})
export class GenerateAbhaComponentComponent {

  abhaGenerateForm!: FormGroup;
  currentLanguageSet: any;
  modeofAbhaHealthID: any;
  aadharNumber: any;
  hide = true;
  maskedAadharNumber: string = '';

  constructor(
    public dialogRef: ZardDialogRef<GenerateAbhaComponentComponent>,
    public httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private readonly dialog: ZardDialogService,
    private readonly viewContainerRef: ViewContainerRef,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.abhaGenerateForm = this.createAbhaGenerateForm();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  closeDialog() {
    this.dialogRef.close();
    this.modeofAbhaHealthID = null;
    this.aadharNumber = null;
  }

  createAbhaGenerateForm() {
    return this.fb.group({
      modeofAbhaHealthID: [null, Validators.required],
      part1: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      part2: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      part3: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]]
    });
  }

  generateABHACard() {
    this.modeofAbhaHealthID =
      this.abhaGenerateForm.controls['modeofAbhaHealthID'].value;
    this.aadharNumber = this.abhaGenerateForm.controls['part1'].value + this.abhaGenerateForm.controls['part2'].value + this.abhaGenerateForm.controls['part3'].value;
    this.generateAbhaCardWithAadhaar();
  }

  generateAbhaCardWithAadhaar() {
    if (this.modeofAbhaHealthID === 'AADHAAR') {
      let reqObj = {
        loginId: this.aadharNumber,
        loginMethod: "aadhaar"
      };
      this.registrarService.requestOtpForAbhaEnroll(reqObj).subscribe((res: any) => {
        if (res.data && res.statusCode === 200) {
          let txnId = res.data.txnId;
          this.dialogRef.close();
          this.confirmationService.alert(res.data.message, "success").afterClosed().subscribe(result => {
            console.log("dialog ref after closed response returning", result)
            if (result !== false) {
              this.routeToOtpPage(txnId);
            }
          })
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      }, (err: any) => {
        this.confirmationService.alert(err.errorMessage, 'error');
      });
    } else if (this.modeofAbhaHealthID === 'BIOMETRIC') {
      this.captureBioAuthentication();
    }
  }

  routeToOtpPage(txnId: any) {
    this.dialog.create({
      zContent: AbhaEnterOtpComponentComponent,
      zData: {
        txnId: txnId,
        healthIdMode: this.modeofAbhaHealthID,
        aadharNumber: this.aadharNumber
      },
      zWidth: '420px',
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
  }

  captureBioAuthentication() {
    const matDialogRef = this.dialog.create<BiometricAuthenticationComponent, unknown>({
      zContent: BiometricAuthenticationComponent,
      zData: { aadharNumber: this.aadharNumber },
      zWidth: '500px',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
    matDialogRef.afterClosed().subscribe((res) => {
      console.log("mat dialog close response: ", res)
      if(res){
        this.mobileNumberCapturePage(res);
      }
    });
  }

  mobileNumberCapturePage(pid: any) {
    const dialogRef = this.dialog.create({
      zContent: AbhaMobileComponentComponent,
      zData: {
        healthIdMode: this.modeofAbhaHealthID,
        pId: pid,
        aadharNumber: this.aadharNumber
      },
      zWidth: '420px',
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }

  get isInvalid() {
    return this.abhaGenerateForm.get('part1')?.invalid || this.abhaGenerateForm.get('part2')?.invalid || this.abhaGenerateForm.get('part3')?.invalid;
  }

  ngOnDestroy() {
    this.abhaGenerateForm.reset();
  }
}
