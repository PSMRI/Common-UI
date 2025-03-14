import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { AbhaMobileComponentComponent } from '../abha-mobile-component/abha-mobile-component.component';
import { AbhaGenerationSuccessComponentComponent } from '../abha-generation-success-component/abha-generation-success-component.component';
import { AbhaVerifySuccessComponentComponent } from '../abha-verify-success-component/abha-verify-success-component.component';
import { GenerateAbhaComponentComponent } from '../generate-abha-component/generate-abha-component.component';

@Component({
  selector: 'app-abha-enter-otp-component',
  templateUrl: './abha-enter-otp-component.component.html',
  styleUrls: ['./abha-enter-otp-component.component.css']
})
export class AbhaEnterOtpComponentComponent {

  healthIdOTPForm!: FormGroup;
  currentLanguageSet: any;
  showProgressBar = false;
  enableSubmitForVerify = false;
  abhaGenerateForm!: FormGroup;
  xToken: any;
  mobileNumber: any;
  enableResend = false;
  countdown: number = 30;  // Initial countdown value (30 seconds)
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AbhaEnterOtpComponentComponent>,
    public httpServiceService: HttpServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
  ) {
    dialogRef.disableClose = true;
  }

  healthIdMode: any = this.data.healthIdMode;
  transactionId: any = this.data.txnId;
  loginMethod: any = this.data.loginMethod;
  aadharNumber: any = this.data.aadharNumber;
  loginHint: any = this.data.loginHint

  ngOnInit() {
    this.assignSelectedLanguage();
    this.healthIdOTPForm = this.createOtpGenerationForm();
    console.log("popup data of enter otp", this.data);
    if (this.loginMethod != null && this.loginMethod != undefined) {
      this.enableSubmitForVerify = true;
    }
    this.startCountdown();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  createOtpGenerationForm() {
    return this.fb.group({
      otp: null
    });
  }

  closeDialog() {
    this.dialogRef.close();
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

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  askMobileNumberForAbha() {
    const dialogRefMobile = this.dialog.open(
      AbhaMobileComponentComponent,
      {
        height: '250px',
        width: '420px',
        disableClose: true,
        data: { txnId: this.transactionId, otp: this.healthIdOTPForm.controls['otp'].value, },
      },
    );
    this.showProgressBar = false;
    dialogRefMobile.afterClosed().subscribe((response) => {
      if (response) {
        console.log("after mobile number success response", response);
        this.transactionId = response.data.txnId;
        this.xToken = response.data.xToken;
        this.mobileNumber = (response.mobileNumber != null && response.mobileNumber != undefined) ? response.mobileNumber : null;
        this.displayAbhaNumberOnSuccess(response.data);
      }
    });
  }

  displayAbhaNumberOnSuccess(data: any) {
    console.log("Abha profile response - ", data);
    const dialogRefSuccess = this.dialog.open(
      AbhaGenerationSuccessComponentComponent,
      {
        height: '365px',
        width: '480px',
        disableClose: true,
        data: { newAbhaResponse: data, xToken: data.xToken, mobileNumber: this.mobileNumber }
      },
    );
    this.showProgressBar = false;
    dialogRefSuccess.afterClosed().subscribe((result) => {
      let abhaData = data.ABHAProfile;
      const dob = `${abhaData.monthOfBirth}/${abhaData.dayOfBirth}/${abhaData.yearOfBirth}`;
      let gender = '';
      if (abhaData.gender === 'F') {
        gender = 'Female';
      } else if (abhaData.gender === 'M') {
        gender = 'Male';
      } else {
        gender = 'Transgender';
      }

      const dat = {
        healthIdNumber: abhaData.healthIdNumber,
        healthId: abhaData.healthId,
        firstName: abhaData.firstName,
        lastName: abhaData.lastName,
        phoneNo: abhaData.mobile,
        dob: dob,
        genderName: gender,
        emailID: abhaData.email,
        stateID: abhaData.stateCode,
        stateName: abhaData.stateName,
        districtID: abhaData.districtCode,
        districtName: abhaData.districtName,
      };
      this.registrarService.setHealthIdMobVerification(dat);
      this.registrarService.getRegistrarAbhaDetail(dat);
      this.dialogRef.close(dat);
    });
  }


  verifyAbhaLogin() {
    let reqObj = {
      loginMethod: this.loginMethod,
      loginId: this.healthIdOTPForm.controls['otp'].value,
      txnId: this.transactionId,
      loginHint: this.loginHint
    }
    this.registrarService.verifyAbhaLogin(reqObj).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.dialogRef.close();
        this.displayAbhaNumberOnVerify(res.data.abhaDetails, res.data.xToken);
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    })
  }

  resendOtp() {
    this.healthIdOTPForm.controls['otp'].reset();
    let reqObj = {
      loginId: this.aadharNumber,
      loginMethod: "aadhaar"
    };
    this.registrarService.requestOtpForAbhaEnroll(reqObj).subscribe((res: any) => {
      if (res.data && res.statusCode === 200) {
        this.transactionId = res.data.txnId;
        this.confirmationService.alert(res.data.message, "success");
      } else {
        this.confirmationService.alert(res.errorMessage, "error");
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, "error");
    });
    // After OTP is resent, restart the countdown timer
    this.countdown = 30; // Reset countdown
    this.startCountdown(); // Restart the countdown
  }

  resendOtpForVerify() {
    let reqObj = null;
    if (this.loginMethod === "abha-aadhaar") {
      reqObj = {
        loginHint: this.loginHint,
        loginMethod: "aadhaar",
        loginId: this.aadharNumber,
      }
    } else if (this.loginMethod === "abha-mobile") {
      reqObj = {
        loginHint: this.loginHint,
        loginMethod: "mobile",
        loginId: this.aadharNumber,
      }
    } else {
      reqObj = {
        loginHint: this.loginHint,
        loginMethod: this.loginMethod,
        loginId: this.aadharNumber,
      }
    }
    this.registrarService.requestOtpForAbhaLogin(reqObj).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.transactionId = res.data.txnId;
        let message = res.data.message;
        this.confirmationService.alert(message, 'success')
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    });
    // After OTP is resent, restart the countdown timer
    this.countdown = 30; // Reset countdown
    this.startCountdown(); // Restart the countdown
  }

  displayAbhaNumberOnVerify(abhaDetails: any, token: any) {
    console.log("Abha details response - ", abhaDetails);
    const dialogRefSuccess = this.dialog.open(
      AbhaVerifySuccessComponentComponent,
      {
        height: '370px',
        width: '480px',
        disableClose: true,
        data: { abhaResponse: abhaDetails, xToken: token, loginHint: this.loginHint }
      },
    );
    this.showProgressBar = false;
    dialogRefSuccess.afterClosed().subscribe((result) => {
      if (result) {
        const dat = {
          healthIdNumber: (abhaDetails.ABHANumber !== undefined && abhaDetails.ABHANumber !== null) ? abhaDetails.ABHANumber : abhaDetails.abhaNumber,
          healthId: (abhaDetails.preferredAbhaAddress !== undefined && abhaDetails.preferredAbhaAddress !== null) ? abhaDetails.preferredAbhaAddress : abhaDetails.abhaAddress,
        };
        this.registrarService.getRegistrarAbhaDetail(dat);
      }
    });
  }


  startCountdown() {
    this.enableResend = false; // Disable the resend button initially

    // Set interval to count down every second
    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;  // Decrease the countdown
      } else {
        clearInterval(this.countdownInterval);  // Clear the interval when countdown reaches 0
        this.enableResend = true;  // Enable the resend button
      }
    }, 1000);  // Update every second
  }


}
