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
import {
  Component,
  DoCheck,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../services/registrar.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

@Component({
  selector: 'app-generate-mobile-otp-generation',
  templateUrl: './generate-mobile-otp-generation.component.html',
  styleUrls: ['./generate-mobile-otp-generation.component.css'],
})
export class GenerateMobileOtpGenerationComponent implements OnInit, DoCheck {
  generateMobileOTPForm!: FormGroup;
  currentLanguageSet: any;
  showProgressBar = false;
  txnId: any;
  enableMobileOTPForm = false;
  bioVal: boolean = false;
  verifyBioMobileOtp: boolean = false;

  constructor(
    private fb: FormBuilder,
    public dialogSucRef: MatDialogRef<GenerateMobileOtpGenerationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
  ) {
    dialogSucRef.disableClose = true;
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.txnId = this.data.transactionId;
    this.bioVal = this.data.bioValue;
    this.generateMobileOTPForm = this.createmobileOTPValidationForm();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  createmobileOTPValidationForm() {
    return this.fb.group({
      mobileNo: null,
      mobileOtp: null,
    });
  }

  closeDialog() {
    this.dialogSucRef.close();
  }

  //while clicking on submit after entering the mobile number
  onSubmitOfMobileNo() {
    if (
      this.enableMobileOTPForm === false &&
      (this.bioVal == null || this.bioVal == undefined || this.bioVal === false)
    ) {
      this.showProgressBar = true;
      let reqObj = {
        mobile: this.generateMobileOTPForm.controls['mobileNo'].value,
        txnId: this.txnId,
      };
      this.registrarService.checkAndGenerateMobileOTPHealthId(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode == 200 && res.data) {
            this.showProgressBar = false;
            if (
              res.data.mobileLinked === false ||
              res.data.mobileLinked === 'false'
            ) {
              this.confirmationService
                .confirm('info', this.currentLanguageSet.enterOTPToVerify)
                .subscribe((responseData) => {
                  if (responseData === false) {
                    this.enableMobileOTPForm = false;
                    this.verifyBioMobileOtp = false;
                  } else {
                    this.enableMobileOTPForm = true;
                    this.verifyBioMobileOtp = false;
                  }
                });
            } else {
              this.dialogSucRef.close(res.data);
            }
          } else {
            this.showProgressBar = false;
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    } else if (this.enableMobileOTPForm === false && this.bioVal === true) {
      this.showProgressBar = true;
      let reqObj = {
        mobile: this.generateMobileOTPForm.controls['mobileNo'].value,
        txnId: this.txnId,
      };
      this.registrarService.generateABHAForBiometricMobileOTP(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode == 200 && res.data.tnxId) {
            this.showProgressBar = false;
            this.enableMobileOTPForm = true;
            this.verifyBioMobileOtp = true;
          } else {
            this.showProgressBar = false;
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    }
  }

  resendOTP() {
    this.showProgressBar = true;
    const reqObj = {
      mobile: this.generateMobileOTPForm.controls['mobileNo'].value,
      txnId: this.txnId,
    };
    this.registrarService.checkAndGenerateMobileOTPHealthId(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.showProgressBar = false;
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err: any) => {
        this.showProgressBar = false;
        this.confirmationService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }

  //entering OTP for mobile verification
  verifyMobileOtp() {
    if(this.enableMobileOTPForm === true && this.verifyBioMobileOtp === true) {
      let reqObj = null;
      this.showProgressBar = true;
      reqObj = {
        otp: this.generateMobileOTPForm.controls['mobileOtp'].value,
        txnId: this.txnId,
      };
      this.registrarService
        .verifyMobileOTPForAadhar(reqObj)
        .subscribe((res: any) => {
          if (res.statusCode === 200) {
            this.dialogSucRef.close(res.data.tnxId);
          } else{
            this.confirmationService.alert(res.errorMessage, "error");
          }
        })
      } else if(this.enableMobileOTPForm === true) {
        let reqObj = null;
        reqObj = {
          "otp": this.generateMobileOTPForm.controls['mobileOtp'].value,
          "txnId": this.txnId,
        }
        this.registrarService.verifyMobileOTPForAadhar(reqObj)
        .subscribe((res: any) => {
          if(res.statusCode ==  200) {
            this.dialogSucRef.close(res.data);
        } else{
          this.confirmationService.alert(res.errorMessage, "error");
        }
      })
      }
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
}
