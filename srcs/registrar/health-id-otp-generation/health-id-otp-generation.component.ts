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
import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { GenerateMobileOtpGenerationComponent } from '../generate-mobile-otp-generation/generate-mobile-otp-generation.component';
import { HealthIdValidateComponent } from '../health-id-validatepopup/health-id-validatepopup.component';
import { RegistrarService } from '../services/registrar.service';
import { SetPasswordForAbhaComponent } from '../set-password-for-abha/set-password-for-abha.component';
import { RdDeviceService } from '../services/rddevice.service';
import { ViewHealthIdCardComponent } from '../view-health-id-card/view-health-id-card.component';
import { authMethodComponent } from '../generate-abha-component/generate-abha-component.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-health-id-otp-generation',
  templateUrl: './health-id-otp-generation.component.html',
  styleUrls: ['./health-id-otp-generation.component.css'],
})
export class HealthIdOtpGenerationComponent implements OnInit, DoCheck {
  healthIdOTPForm!: FormGroup;
  healthIdMobileForm!: FormGroup;
  currentLanguageSet: any;
  altNum: any;
  mobileNum: any;
  enablehealthIdOTPForm = false;
  transactionId: any;
  showProgressBar = false;
  password: any;
  aadharNum: any;
  registrarMasterData: any;
  demographicsMaster: any;
  authOption: boolean = false;
  modeofAuthMethod: any;
  abhaHealthMode: any;
  pidRes: any;
  healthIDCard: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HealthIdOtpGenerationComponent>,
    public httpServiceService: HttpServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
  ) {
    dialogRef.disableClose = true;
  }

  mobileNumber: any = this.data.mobileNumber;
  healthIdMode: any = this.data.healthIdMode;

  ngOnInit() {
    this.assignSelectedLanguage();
    this.healthIdMobileForm = this.createmobileValidationForm();
    this.healthIdOTPForm = this.createOtpGenerationForm();
    if (this.healthIdMode === 'AADHAR') {
      this.enablehealthIdOTPForm = true;
      this.getHealthIdOtpForInitial();
    }
    this.loadMasterDataObservable();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
  createmobileValidationForm() {
    return this.fb.group({
      mobileNo: null,
    });
  }
  createOtpGenerationForm() {
    return this.fb.group({
      otp: null,
    });
  }
  closeDialog() {
    this.dialogRef.close();
  }
  enableMobileNo(event: any) {
    if (event.checked) {
      this.altNum = true;
    } else {
      this.altNum = false;
      this.healthIdMobileForm.reset();
    }
  }

  getHealthIdOtpForInitial() {
    this.healthIdOTPForm.patchValue({
      otp: null,
    });
    if (this.altNum === true) {
      this.mobileNum = this.healthIdMobileForm.controls['mobileNo'].value;
    } else {
      this.mobileNum = this.mobileNumber;
    }
    this.enablehealthIdOTPForm = true;
    this.showProgressBar = true;
    let reqObj = null;
    if (this.healthIdMode === 'MOBILE') {
      reqObj = {
        mobile: this.mobileNum,
      };
    } else if (this.healthIdMode === 'AADHAR') {
      reqObj = {
        aadhaar: this.data.aadharNumber,
      };
      if (
        this.data.aadharNumber !== undefined &&
        this.data.aadharNumber !== null
      ) {
        this.aadharNum = this.data.aadharNumber;
      }
    }
    this.registrarService.generateOTP(reqObj, this.healthIdMode).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.showProgressBar = false;
          if (this.healthIdMode === 'MOBILE')
            this.confirmationService.alert(
              this.currentLanguageSet.OTPSentToMobNo + res.data.mobile,
              'success',
            );
          else if (this.healthIdMode === 'AADHAR')
            this.confirmationService.alert(
              this.currentLanguageSet.OTPSentToAadharLinkedNo,
              'success',
            );

          this.transactionId = res.data.txnId;
          this.enablehealthIdOTPForm = true;
        } else {
          this.showProgressBar = false;
          this.dialogRef.close();
          this.dialogRef.afterClosed().subscribe((result) => {
            this.confirmationService.alert(res.errorMessage, 'error');
          });
        }
      },
      (err: any) => {
        this.showProgressBar = false;
        this.dialogRef.close();
        this.dialogRef.afterClosed().subscribe((result) => {
          this.confirmationService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        });
      },
    );
  }

  getHealthIdOtp() {
    this.healthIdOTPForm.patchValue({
      otp: null,
    });
    if (this.altNum === true) {
      this.mobileNum = this.healthIdMobileForm.controls['mobileNo'].value;
    } else {
      this.mobileNum = this.mobileNumber;
    }
    this.enablehealthIdOTPForm = true;
    this.showProgressBar = true;
    let reqObj = null;
    if (this.healthIdMode === 'MOBILE') {
      reqObj = {
        mobile: this.mobileNum,
      };
    } else if (this.healthIdMode === 'AADHAR') {
      reqObj = {
        aadhaar: this.data.aadharNumber,
      };
    }
    this.registrarService.generateOTP(reqObj, this.healthIdMode).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.showProgressBar = false;
          if (this.healthIdMode === 'MOBILE')
            this.confirmationService.alert(
              this.currentLanguageSet.OTPSentToMobNo + res.data.mobile,
              'success',
            );
          else if (this.healthIdMode === 'AADHAR')
            this.confirmationService.alert(
              this.currentLanguageSet.OTPSentToAadharLinkedNo,
              'success',
            );

          this.transactionId = res.data.txnId;
          this.enablehealthIdOTPForm = true;
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
          if (this.healthIdMode === 'MOBILE')
            this.enablehealthIdOTPForm = false;
          else this.enablehealthIdOTPForm = true;
        }
      },
      (err: any) => {
        this.showProgressBar = false;
        this.confirmationService.alert(err.errorMessage, 'error');
        if (this.healthIdMode === 'MOBILE') this.enablehealthIdOTPForm = false;
        else this.enablehealthIdOTPForm = true;
      },
    );
  }

  masterDataSubscription: any;
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res: any) => {
        console.log('Registrar master data', res);
        if (res !== null) {
          this.registrarMasterData = Object.assign({}, res);
          console.log('master data', this.registrarMasterData);
        }
      });
  }
  posthealthIDButtonCall() {
    const dialogRefPass = this.dialog.open(SetPasswordForAbhaComponent, {
      height: '350px',
      width: '520px',
      disableClose: true,
    });
    dialogRefPass.afterClosed().subscribe((result) => {
      this.password = result;
      const reqObj = {
        email: this.data.email,
        firstName: this.data.firstName,
        middleName: this.data.middleName,
        lastName: this.data.lastName,
        password: this.password,
        txnId: this.transactionId,
        profilePhoto: this.data.profilePhoto,
        healthId: this.data.healthId,
        createdBy: localStorage.getItem('userName'),
        providerServiceMapID: localStorage.getItem('providerServiceID'),
      };
      this.registrarService.generateHealthIdWithUID(reqObj).subscribe( 
        (res: any) => {
          if (res.statusCode === 200 && res.data) {
            this.registrarService.abhaGenerateData = res.data;
            console.log(this.registrarService.abhaGenerateData, "MY ABHA STORED RES");
            this.registrarService.aadharNumberNew = this.aadharNum;
            this.registrarService.getabhaDetail(true);

            const dialogRefSuccess = this.dialog.open(
              HealthIdOtpSuccessComponent,
              {
                height: '380px',
                width: '480px',
                disableClose: true,
                data: res,
              },
            );
            this.showProgressBar = false;
            dialogRefSuccess.afterClosed().subscribe((result) => {
              const dob = `${res.data.dayOfBirth}/${res.data.monthOfBirth}/${res.data.yearOfBirth}`;
              let gender = '';
              if (res.data.gender === 'F') {
                gender = 'Female';
              } else if (res.data.gender === 'M') {
                gender = 'Male';
              } else {
                gender = 'Transgender';
              }

              const dat = {
                healthIdNumber: res.data.healthIdNumber,
                healthId: res.data.healthId,
                firstName: res.data.firstName,
                lastName: res.data.lastName,
                phoneNo: res.data.mobile,
                dob: dob,
                genderName: gender,
                emailID: res.data.email,
                state: res.data.stateName,
                district: res.data.districtName,
              };
              this.registrarService.setHealthIdMobVerification(dat);
              this.registrarService.getRegistrarAbhaDetail(dat);
              this.dialogRef.close(dat);
            });
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
    });
  }

  verifyOTPOnSubmit() {
    this.showProgressBar = true;
    let reqObj = null;
    reqObj = {
      otp: this.healthIdOTPForm.controls['otp'].value,
      txnId: this.transactionId,
    };
    this.registrarService.verifyOTPForAadharHealthId(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.dialogRef.close();
          if (
            res.data.mobileNumber === undefined ||
            res.data.mobileNumber === null
          ) {
            this.transactionId = res.data.tnxId;
            this.checkandGenerateToVerifyMobileOTP();
          } else {
            const requestObj = {
              mobile: res.data.mobileNumber,
              txnId: res.data.tnxId,
            };
            this.registrarService
              .checkAndGenerateMobileOTPHealthId(requestObj)
              .subscribe((resOtp: any) => {
                if (resOtp.statusCode === 200 && resOtp.data) {
                  this.transactionId = resOtp.data.txnId;
                  this.dialogRef.close();
                  this.posthealthIDButtonCall();
                }
              });
          }
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

  checkandGenerateToVerifyMobileOTP() {
    const dialogRefMobile = this.dialog.open(
      GenerateMobileOtpGenerationComponent,
      {
        height: '250px',
        width: '420px',
        disableClose: true,
        data: { transactionId: this.transactionId },
      },
    );
    this.showProgressBar = false;
    dialogRefMobile.afterClosed().subscribe((response) => {
      if (response !== undefined && response !== null) {
        this.transactionId = response.tnxId;
        this.posthealthIDButtonCall();
      }
    });
  }
  checkOTP() {
    const otp = this.healthIdOTPForm.controls['otp'].value;
    let cflag = false;
    if (otp !== '' && otp !== undefined && otp !== null) {
      const hid = otp;
      if (hid.length >= 4 && hid.length <= 32) {
        for (let i = 0; i < hid.length; i++) {
          if (!this.is_numeric(hid.charAt(i))) {
            cflag = true;
            break;
          }
        }
        if (cflag) return false;
      } else return false;
    } else return false;
    return true;
  }
  isLetter(str: any) {
    return str.length === 1 && str.match(/[a-z]/i);
  }
  is_numeric(str: any) {
    return /^\d+$/.test(str);
  }
}

@Component({
  selector: 'app-health-id-otp-succespopup',
  templateUrl: './health-id-otp-succespopup.html',
  styleUrls: ['./health-id-otp-generation.component.css'],
})
export class HealthIdOtpSuccessComponent implements OnInit, DoCheck {
  verify: boolean=false;
  genderName!: string;
  currentLanguageSet: any;
  transactionId: any;
  showProgressBar!: boolean;
  fetchHealthIds: any;
  otherDetailsForm: any;
  authOption: boolean = false;
  modeofAuthMethod: any;
  abhaHealthMode: any;
  pidRes: any;
  healthIDCard: any;

  constructor(
    public dialogSucRef: MatDialogRef<HealthIdOtpSuccessComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationValService: ConfirmationService,
    private rdservice: RdDeviceService,
  ) {
    console.log('popupdata');
  }
  succdata: any = this.data.data;
  ngOnInit() {
    this.assignSelectedLanguage();
    this.fetchHealthIdsValue();
    console.log('popupdata', this.succdata);
    if (this.succdata.Auth) {
      if (
        this.succdata.Auth.Patient !== undefined &&
        this.succdata.Auth.Patient !== null
      )
        this.verify = true;
      if (
        this.succdata.Auth.Patient.Gender !== undefined &&
        this.succdata.Auth.Patient.Gender !== null
      ) {
        this.genderName =
          this.succdata.Auth.Patient.Gender === '0'
            ? 'Male'
            : this.succdata.Auth.Patient.Gender === '1'
              ? 'Female'
              : this.succdata.Auth.Patient.Gender === '2'
                ? 'Transgender'
                : 'Transgender';
      }
    }
  }
  closeSuccessDialog() {
    this.dialogSucRef.close();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  fetchHealthIdsValue() {
    const fetchHealthIdSubscription =
      this.registrarService.generateHealthIdOtp$.subscribe(
        (healthIdResponse: any) => {
          this.fetchHealthIds = healthIdResponse;
        },
        (err: any) => {
          console.log(err);
        },
        () => {
          console.log('completed');
        },
      );
    fetchHealthIdSubscription.unsubscribe();
  }

  openDialogForprintHealthIDCard(data: any, txnId: any) {
    const dialogRefValue = this.dialog.open(HealthIdValidateComponent, {
      height: '240px',
      width: '500px',
      disableClose: true,
      data: {
        healthId: data,
        authenticationMode: this.abhaHealthMode,
        generateHealthIDCard: true,
        healthIDDetailsTxnID: txnId,
      },
    });

    dialogRefValue.afterClosed().subscribe((result) => {
      console.log('result', result);
    });
  }

  fetchOtp(healthIdValue: any, healthIdNumber: any){
    this.dialogSucRef.close();
    let dialogRef = this.dialog.open(authMethodComponent, {
      height: '250px',
      width: '420px',
    });
    dialogRef.afterClosed().subscribe(response => {
      console.log('result', response);
      if(response) {
        this.abhaHealthMode = response;
        if(this.abhaHealthMode != null && this.abhaHealthMode != undefined) {
          this.showProgressBar = true;
          let reqObj = {
            authMethod: this.abhaHealthMode,
            healthid: healthIdValue ? healthIdValue : null,
            healthIdNumber: healthIdNumber ? healthIdNumber : null
          }
          this.registrarService.generateHealthIDCard(reqObj)
          .subscribe((res: any)=> {
           
            if(res.statusCode == 200 && res.data) {
             
              if (this.abhaHealthMode === "MOBILE_OTP")
              {
              this.transactionId = res.data.txnId;
              this.confirmationValService.confirmHealthId('success', this.currentLanguageSet.OTPSentToRegMobNo).subscribe((result) => {
                if(result)
                {
                  this.openDialogForprintHealthIDCard(healthIdValue,this.transactionId);
                }
              });
            }
            else if (this.abhaHealthMode == "AADHAAR_OTP")
            {
              this.transactionId = res.data.txnId;
              this.confirmationValService.confirmHealthId('success', this.currentLanguageSet.OTPSentToAadharLinkedNo).subscribe((result) => {
                if(result)
                {
                  this.openDialogForprintHealthIDCard(healthIdValue,this.transactionId);
                }
                });
            }
          
            else if (this.abhaHealthMode === "AADHAAR_BIO")
            {
              this.transactionId = res.data.txnId;
                if(this.transactionId != null && this.transactionId != undefined)
                {
                  // this.openDialogForprintHealthIDCard(healthIdValue,this.transactionId);
                  // this.downloadABHAForBio(this.transactionId);
                }
              }
            this.showProgressBar = false;
            }
            else {
              this.showProgressBar = false;
              this.confirmationValService.alert(res.errorMessage, 'error');
            }
          }, err => {
            this.showProgressBar = false;
            this.confirmationValService.alert(err.errorMessage, 'error');
          })
        }
      }
    });
  }

  downloadABHAForBio(txnId: any) {
    this.rdservice.pidDetailDetails$.subscribe((piddata) => {
      if(piddata != null && piddata != undefined) {
        this.pidRes = piddata;
      }
    });
    if(this.pidRes != null && this.pidRes !== undefined) {
    let requestObj = {
      pid: this.pidRes ? this.pidRes : null,
      txnId: txnId,
      authType: "FINGERSCAN",
      bioType: "FMR",
     }
       this.registrarService.confirmAadhar(requestObj).subscribe((res: any)=> {
        if(res.statusCode == 200 && res.data != null ){
          this.healthIDCard = res.data;
          this.dialog.open(ViewHealthIdCardComponent, {
            height: "530px",
            width: "800px",
            data: {
              imgBase64: this.healthIDCard,
            },
          });

          this.dialogSucRef.close();
        } else {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.aBHACardNotAvailable + " - " + res.errorMessage, "error" );
         }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationValService.alert(err.errorMessage, "error");
      }
    );
    }
    this.rdservice.getpidDetail(null);
  }
}
