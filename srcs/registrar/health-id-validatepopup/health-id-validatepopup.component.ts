import { Component, DoCheck, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { SetLanguageComponent } from "src/app/app-modules/core/components/set-language.component";
import { ConfirmationService } from "src/app/app-modules/core/services";
import { HttpServiceService } from "src/app/app-modules/core/services/http-service.service";
import { environment } from "src/environments/environment";
import { RegistrarService } from "../services/registrar.service";
import { BiometricAuthenticationComponent } from "../biometric-authentication/biometric-authentication.component";
import { ViewHealthIdCardComponent } from "../view-health-id-card/view-health-id-card.component";
import { HealthIdOtpSuccessComponent } from "../health-id-otp-generation/health-id-otp-generation.component";

@Component({
  selector: 'app-health-id-validatepopup',
  templateUrl: './health-id-validatepopup.component.html',
  styleUrls: ['./health-id-validatepopup.component.css'],
})
export class HealthIdValidateComponent implements OnInit, DoCheck {
  healthIdValidateForm!: FormGroup;
  healthIdSearchForm!: FormGroup;
  RequestId: any;
  gender: any;
  firstName: any;
  lastName: any;
  userHealthId: any;
  enablehealthIdOTP = 'form';
  searchHealthid: any;
  //Health ID Card
  healthIDCard: any;
  idErrorText!: string;
  patternID!: RegExp;
  address: any;
  abhaSuffix = environment.abhaExtension;
  constructor(
    public dialogRef: MatDialogRef<HealthIdValidateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private fb: FormBuilder,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationValService: ConfirmationService,
  ) {
    console.log('popupdata');
  }
  valhealthId: any = this.data.healthId;
  healthIdMode: any = this.data.authenticationMode;
  enableHealthIDCard: any = false;
  currentLanguageSet: any;
  showProgressBar = false;
  transactionId: any;
  ngOnInit() {
    if (this.data.generateHealthIDCard !== undefined) {
      this.enableHealthIDCard = this.data.generateHealthIDCard;
    } else {
      this.enableHealthIDCard = false;
    }
    this.healthIdValidateForm = this.createOtpValidationForm();
    this.healthIdSearchForm = this.createSearchHealthIDForm();
    console.log('popupdata', this.valhealthId);
    if (this.valhealthId === 'NO') {
      this.enablehealthIdOTP = 'form';
    } else {
      this.enablehealthIdOTP = 'OTP';

      if (
        this.data.healthIDDetailsTxnID !== undefined ||
        this.data.healthIDDetailsTxnID
      ) {
        this.resetValidateForm();
      } else {
        this.getHealthIdOtp();
      }
    }
  }

  resetValidateForm() {
    this.healthIdValidateForm.patchValue({
      validateotp: null,
    });
    this.healthIdSearchForm.patchValue({
      searchHealth: null,
    });
    this.healthIdSearchForm.patchValue({
      modeofhealthID: null,
    });

    this.transactionId = this.data.healthIDDetailsTxnID;
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
  createOtpValidationForm() {
    return this.fb.group({
      validateotp: null,
    });
  }
  createSearchHealthIDForm() {
    return this.fb.group({
      searchHealth: null,
      modeofhealthID: null,
    });
  }
  closeDialog() {
    this.dialogRef.close();
  }

  getHealthIDDetails() {
    const required = [];
    this.searchHealthid =
      this.healthIdSearchForm.controls['searchHealth'].value;
    this.healthIdMode =
      this.healthIdSearchForm.controls['modeofhealthID'].value;
    if (!this.searchHealthid) required.push(this.currentLanguageSet.enterABHA);
    if (!this.healthIdMode)
      required.push(this.currentLanguageSet.aBHAGenerationMode);
    if (required.length) {
      this.confirmationValService.alert(required.toString(), 'info');
    }
    if (this.searchHealthid && this.healthIdMode && this.checkValidHealthID()) {
      this.valhealthId = this.searchHealthid;
      this.getHealthIdOtpForInitial();
    }
  }

  getHealthIdOtpForInitial() {
    this.healthIdValidateForm.patchValue({
      validateotp: null,
    });
    this.healthIdSearchForm.patchValue({
      searchHealth: null,
    });
    this.healthIdSearchForm.patchValue({
      modeofhealthID: null,
    });

    if (this.data.generateHealthIDCard) {
      if (
        this.healthIdMode !== undefined &&
        this.healthIdMode !== null &&
        this.healthIdMode === 'AADHAR'
      ) {
        this.healthIdMode = 'AADHAAR';
        this.showProgressBar = true;
        const reqObj = {
          authMethod: this.healthIdMode + '_OTP',
          healthid: this.valhealthId,
        };
        this.registrarService.generateHealthIDCard(reqObj).subscribe(
          (res: any) => {
            if (res.statusCode === 200 && Object.keys(res.data).length > 0) {
              this.showProgressBar = false;
              this.transactionId = res.data.txnId;
              this.enablehealthIdOTP = 'OTP';
              if (this.healthIdMode === 'MOBILE')
                this.confirmationValService.alert(
                  this.currentLanguageSet.OTPSentToRegMobNo,
                  'success',
                );
              else if (this.healthIdMode === 'AADHAAR')
                this.confirmationValService.alert(
                  this.currentLanguageSet.OTPSentToAadharLinkedNo,
                  'success',
                );
            } else {
              this.showProgressBar = false;
              this.confirmationValService.alert(
                this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
                'error',
              );
            }
          },
          (err) => {
            this.showProgressBar = false;
            this.confirmationValService.alert(
              this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
              'error',
            );
          },
        );
      } else if (
        this.healthIdMode !== undefined &&
        this.healthIdMode !== null &&
        this.healthIdMode === 'BIOMETRIC'
      ) {
        const matDialogRef: MatDialogRef<BiometricAuthenticationComponent> =
          this.dialog.open(BiometricAuthenticationComponent, {
            width: '500px',
            height: '320px',
            disableClose: true,
          });
        matDialogRef.afterClosed().subscribe((res: any) => {});
      }
    } else {
      this.showProgressBar = true;
      const reqObj = {
        healthID: this.valhealthId,
        isValidate: true,
        authenticationMode: this.healthIdMode,
      };
      this.registrarService.generateOTPValidateHealthID(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            this.showProgressBar = false;
            this.enablehealthIdOTP = 'OTP';
            if (this.healthIdMode === 'MOBILE')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToRegMobNo,
                'success',
              );
            else if (this.healthIdMode === 'AADHAR')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToAadharLinkedNo,
                'success',
              );

            this.transactionId = res.data.txnId;
          } else {
            this.showProgressBar = false;
            const dat = {
              clearHealthID: true,
            };
            this.dialogRef.close(dat);
            this.confirmationValService.alert(
              this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
              'error',
            );
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    }
  }

  isLetter(str: string) {
    return str.length === 1 && str.match(/[a-z]/i);
  }
  is_numeric(str: string) {
    return /^\d+$/.test(str);
  }
  getHealthIdOtp() {
    this.healthIdValidateForm.patchValue({
      validateotp: null,
    });
    this.healthIdSearchForm.patchValue({
      searchHealth: null,
    });
    this.healthIdSearchForm.patchValue({
      modeofhealthID: null,
    });

    if (this.data.generateHealthIDCard) {
      if (
        this.healthIdMode !== undefined &&
        this.healthIdMode !== null &&
        this.healthIdMode === 'AADHAR'
      )
        this.healthIdMode = 'AADHAAR';
      this.showProgressBar = true;
      const reqObj = {
        authMethod: this.healthIdMode + '_OTP',
        healthid: this.valhealthId,
      };
      this.registrarService.generateHealthIDCard(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && Object.keys(res.data).length > 0) {
            this.showProgressBar = false;
            this.transactionId = res.data.txnId;

            if (this.healthIdMode === 'MOBILE')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToRegMobNo,
                'success',
              );
            else if (this.healthIdMode === 'AADHAAR')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToAadharLinkedNo,
                'success',
              );
          } else {
            this.showProgressBar = false;
            this.confirmationValService.alert(res.status, 'error');
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    } else {
      this.showProgressBar = true;
      const reqObj = {
        healthID: this.valhealthId,
        isValidate: true,
        authenticationMode: this.healthIdMode,
      };
      this.registrarService.generateOTPValidateHealthID(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            this.showProgressBar = false;

            if (this.healthIdMode === 'MOBILE')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToRegMobNo,
                'success',
              );
            else if (this.healthIdMode === 'AADHAR')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToAadharLinkedNo,
                'success',
              );

            this.transactionId = res.data.txnId;
          } else {
            this.showProgressBar = false;
            const dat = {
              clearHealthID: true,
            };
            this.dialogRef.close(dat);
            this.confirmationValService.alert(res.status, 'error');
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    }
  }

  checkValidHealthID() {
    const healthidval = this.healthIdSearchForm.controls['searchHealth'].value;
    if (healthidval.length >= 8 && healthidval.length <= 32) {
      if (healthidval.length === 14) {
        const healthIDNumberPatternWithoutHypen = /\d{14}$/;
        return this.validateHealthIDNumberPattern(
          healthIDNumberPatternWithoutHypen,
          healthidval,
        );
      } else if (healthidval.length === 17) {
        const healthIDNumberPatternWithHypen =
          /^(\d{2})-(\d{4})-(\d{4})-(\d{4})*$/;
        return this.validateHealthIDNumberPattern(
          healthIDNumberPatternWithHypen,
          healthidval,
        );
      } else {
        return this.validateHealthIDPattern(healthidval);
      }
    } else {
      this.idErrorText = 'Please Valid Health ID / HealthID Number';
    }
  }
  validateHealthIDNumberPattern(pattern: any, healthidval: any) {
    const checkPattern = pattern.test(healthidval);
    if (checkPattern) {
      return true;
    } else {
      return this.validateHealthIDPattern(healthidval);
    }
  }
  validateHealthIDPattern(healthidval: any) {
    let healthIDPattern;
    if (environment.abhaExtension === '@abdm') {
      healthIDPattern = /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{4})$/;
    } else {
      healthIDPattern = /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{3})$/;
    }
    const checkPattern = healthIDPattern.test(healthidval);
    if (checkPattern) {
      return true;
    }
  }
  posthealthIDValidationCall() {
    this.showProgressBar = true;
    const reqObjOTP = {
      otp: this.healthIdValidateForm.controls['validateotp'].value,
      txnId: this.transactionId,
      healthId: this.valhealthId,
    };
    this.registrarService.verifyOTPForHealthIDValidation(reqObjOTP).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.showProgressBar = false;
          this.RequestId = res.data.RequestId;
          if (this.RequestId) {
            this.gender =
              res.data.Auth.Patient.Gender === '0'
                ? 1
                : res.data.Auth.Patient.Gender === '1'
                  ? 2
                  : res.data.Auth.Patient.Gender === '2'
                    ? 3
                    : 3;

            this.firstName =
              res.data.Auth.Patient.Name.split(' ')[0] === undefined
                ? ''
                : res.data.Auth.Patient.Name.split(' ')[0];
            this.lastName =
              res.data.Auth.Patient.Name.split(' ')[1] === undefined
                ? ''
                : res.data.Auth.Patient.Name.split(' ')[1];
            this.userHealthId = res.data.Auth.Patient.Id;
            this.address = res.data.Auth.Patient.Address;
            const dat = {
              healthIdNumber: this.userHealthId,
              RequestId: this.RequestId,
              gender: this.gender,
              firstName: this.firstName,
              lastName: this.lastName,
              healthIdMode: this.healthIdMode,
              address: this.address,
            };
            const dialogRef = this.dialog.open(HealthIdOtpSuccessComponent, {
              height: '460px',
              width: '520px',
              disableClose: true,
              data: res,
            });
            this.dialogRef.close(dat);
          } else {
            this.showProgressBar = false;
            const dat = {
              clearHealthID: true,
            };
            this.dialogRef.close(dat);
            this.confirmationValService.alert(res.data.response, 'error');
          }
        } else {
          this.showProgressBar = false;
          this.confirmationValService.alert(res.status, 'error');
        }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationValService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }
  postHealthIDCardCall() {
    this.showProgressBar = true;
    if (this.healthIdMode === 'AADHAR') {
      this.healthIdMode = 'AADHAAR';
    }
    const reqObjOTP = {
      authMethod: this.healthIdMode + '_OTP',
      otp: this.healthIdValidateForm.controls['validateotp'].value,
      txnId: this.transactionId,
    };
    this.registrarService.verifyOTPForHealthIDCard(reqObjOTP).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.showProgressBar = false;
          this.healthIDCard = res.data.data;
          if (this.healthIDCard !== undefined && this.healthIDCard !== null) {
            this.dialog.open(ViewHealthIdCardComponent, {
              height: '530px',
              width: '800px',
              data: {
                imgBase64: this.healthIDCard,
              },
            });

            this.dialogRef.close();
          } else {
            this.showProgressBar = false;
            this.confirmationValService.alert(
              this.currentLanguageSet.aBHACardNotAvailable,
              'error',
            );
          }
        } else {
          this.showProgressBar = false;
          this.confirmationValService.alert(res.status, 'error');
        }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationValService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }
  checkOTP() {
    const otp = this.healthIdValidateForm.controls['validateotp'].value;
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
}
