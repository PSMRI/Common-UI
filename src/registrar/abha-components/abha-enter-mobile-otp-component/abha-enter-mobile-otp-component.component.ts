import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';

@Component({
  selector: 'app-abha-enter-mobile-otp-component',
  templateUrl: './abha-enter-mobile-otp-component.component.html',
  styleUrls: ['./abha-enter-mobile-otp-component.component.css']
})
export class AbhaEnterMobileOtpComponentComponent {
  generateMobileOTPForm!: FormGroup;
  txnId: any;
  loginId: any;
  currentLanguageSet: any;
  showProgressBar = false;
  mobileNumber: any;

  constructor(
    private fb: FormBuilder,
    public dialogSucRef: MatDialogRef<AbhaEnterMobileOtpComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
  ) {
    dialogSucRef.disableClose = true;
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.generateMobileOTPForm = this.createmobileOTPValidationForm();
    this.txnId = this.data.txnId;
    this.mobileNumber = this.data.mobileNumber;
    this.mobileEnrollmentForAbha();
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
      mobileOtp: null,
    });
  }

  closeDialog() {
    this.dialogSucRef.close();
  }

  mobileEnrollmentForAbha(){
      let reqObj = null;
      this.showProgressBar = true;
      reqObj = {
        loginId: this.mobileNumber,
        txnId: this.data.txnId,
        loginMethod: "mobile",
      };
      this.registrarService.requestOtpForAbhaEnroll(reqObj).subscribe((res: any) => {
        this.showProgressBar = false;
        if(res.statusCode === 200 && res.data != null){
          this.txnId = this.data.txnId
          this.confirmationService.alert(res.data.message, 'success');
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      }, (err) => {
        this.showProgressBar = false;
        this.confirmationService.alert(err.errorMessage, 'error');
      });
  }

  verifyMobileAuthAfterAbhaCreation(){
    let reqObj = null;
    this.showProgressBar = true;
    reqObj = {
      loginId: this.generateMobileOTPForm.controls['mobileOtp'].value,
      txnId: this.txnId,
      loginMethod: "mobile",
    };
    this.registrarService.verifyMobileForAbhaAuth(reqObj).subscribe((res: any) => {
      if(res.statusCode === 200 && res.data != null){
        this.confirmationService.alert(res.data.message, 'success');
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    }, (err) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    } )
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
}
