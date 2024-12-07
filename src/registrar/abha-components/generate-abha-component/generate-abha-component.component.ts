import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { BiometricAuthenticationComponent } from '../biometric-authentication/biometric-authentication.component';
import { AbhaEnterOtpComponentComponent } from '../abha-enter-otp-component/abha-enter-otp-component.component';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { AbhaMobileComponentComponent } from '../abha-mobile-component/abha-mobile-component.component';

@Component({
  selector: 'app-generate-abha-component',
  templateUrl: './generate-abha-component.component.html',
  styleUrls: ['./generate-abha-component.component.css']
})
export class GenerateAbhaComponentComponent {

  abhaGenerateForm!: FormGroup;
  currentLanguageSet: any;
  modeofAbhaHealthID: any;
  aadharNumber: any;

  constructor(
    public dialogRef: MatDialogRef<GenerateAbhaComponentComponent>,
    public httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private dialog: MatDialog,
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
      aadharNumber: [
        null,
        [
          Validators.required,
          Validators.pattern('^[0-9]*$')
        ]
      ],
    });
  }

  generateABHACard() {
    this.modeofAbhaHealthID =
      this.abhaGenerateForm.controls['modeofAbhaHealthID'].value;
    this.aadharNumber = this.abhaGenerateForm.controls['aadharNumber'].value;
      this.generateAbhaCardWithAadhaar();
  }

  generateAbhaCardWithAadhaar(){
    if(this.modeofAbhaHealthID === 'AADHAR'){
    let reqObj = {
      loginId: this.aadharNumber,
      loginMethod: "aadhaar"
    }; 
    this.registrarService.RequestOtpForAbhaEnroll(reqObj).subscribe((res: any) => {
      if(res.data && res.statusCode === 200){
        let txnId = res.data.txnId;
        this.dialogRef.close();
        this.confirmationService.alert(res.data.message, "success").afterClosed().subscribe(result => {
          console.log("dialog ref after closed response returning", result)
          if(result){
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


  routeToOtpPage(txnId: any){
    const dialogRef = this.dialog.open(AbhaEnterOtpComponentComponent, {
      height: '250px',
      width: '420px',
      data: {
        txnId: txnId,
        healthIdMode: this.modeofAbhaHealthID,
        aadharNumber: this.aadharNumber
      },
    });
  }

  captureBioAuthentication(){
    const matDialogRef: MatDialogRef<BiometricAuthenticationComponent> =
    this.dialog.open(BiometricAuthenticationComponent, {
      width: '500px',
      height: '320px',
      disableClose: true,
      data: {aadharNumber: this.aadharNumber}
    });
  matDialogRef.afterClosed().subscribe((res) => {
    console.log("mat ialog close response: ", res)
    if(res){
      this.mobileNumberCapturePage(res);
    }
  });
  }

  mobileNumberCapturePage(pid: any){
    const dialogRef = this.dialog.open(AbhaMobileComponentComponent, {
      height: '250px',
      width: '420px',
      data: {
        healthIdMode: this.modeofAbhaHealthID,
        pId: pid,
        aadharNumber: this.aadharNumber
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
    });
  }
}
