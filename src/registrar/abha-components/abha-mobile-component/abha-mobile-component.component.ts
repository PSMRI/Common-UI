import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SessionStorageService } from '../../services/session-storage.service';

@Component({
  selector: 'app-abha-mobile-component',
  templateUrl: './abha-mobile-component.component.html',
  styleUrls: ['./abha-mobile-component.component.css']
})
export class AbhaMobileComponentComponent {
  generateMobileOTPForm!: FormGroup;
  currentLanguageSet: any;
  showProgressBar = false;
  txnId: any;
  otp: any;
  healthIdGenerationMode: any;
  aadhaarNumber: any;

  constructor(
    private fb: FormBuilder,
    public dialogSucRef: MatDialogRef<AbhaMobileComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private sessionstorage:SessionStorageService,
  ) {
    dialogSucRef.disableClose = true;
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.txnId = this.data.txnId;
    this.otp = this.data.otp;
    this.aadhaarNumber = this.data.aadharNumber;
    this.healthIdGenerationMode = this.data.healthIdMode;
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
      mobileNo: [null, 
        Validators.required,
      ],
    });
  }

  closeDialog() {
    this.dialogSucRef.close();
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  onSubmitOfMobileNo(){
    if(this.healthIdGenerationMode === "BIOMETRIC"){
      let reqObj = {
        loginMethod: "biometric",
        loginId: this.aadhaarNumber, 
        pId: this.data.pId,
        mobileNumber: this.generateMobileOTPForm.controls['mobileNo'].value,
        txnId: this.txnId,
        createdBy: this.sessionstorage.getItem('userName'),
        providerServiceMapId: this.sessionstorage.getItem('providerServiceID')
      };
      this.enrollmentWithAadhaar(reqObj);
    } else {
      let reqObj = {
        loginMethod: "aadhaar",
        loginId: this.otp,
        mobileNumber: this.generateMobileOTPForm.controls['mobileNo'].value,
        txnId: this.txnId,
        createdBy: this.sessionstorage.getItem('userName'),
        providerServiceMapId: this.sessionstorage.getItem('providerServiceID')
      };
      this.enrollmentWithAadhaar(reqObj);
    }
  }

  enrollmentWithAadhaar(reqObj: any) {
      this.showProgressBar = true;
      this.registrarService.enrollAbhaByAadhaar(reqObj).subscribe((res: any) => {
        if(res.statusCode == 200 && res.data){
          this.showProgressBar = false;
          let data = {
            mobileNumber: this.generateMobileOTPForm.controls['mobileNo'].value,
            data: res.data
          }
          this.dialogSucRef.close(data);
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
