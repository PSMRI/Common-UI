import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { environment } from 'src/environments/environment';
import { AbhaEnterOtpComponentComponent } from '../abha-enter-otp-component/abha-enter-otp-component.component';

@Component({
  selector: 'app-download-search-abha',
  templateUrl: './download-search-abha.component.html',
  styleUrls: ['./download-search-abha.component.css']
})
export class DownloadSearchAbhaComponent {
  currentLanguageSet: any;
  abhaAuthMethodForm!: FormGroup;
  idErrorText:any;
  enterAuthIdLabel = null;
  abhaSuffix = environment.abhaExtension;
  enableAuthIdField = false;

  constructor(
    public dialogRef: MatDialogRef<DownloadSearchAbhaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private fb: FormBuilder,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationValService: ConfirmationService,
  ) {
    console.log('popupdata');
  }

  ngOnInit(): void {
    this.abhaAuthMethodForm = this.createAbhaAuthMethod();
  }
  
  createAbhaAuthMethod() {
    return this.fb.group({
      modeofAuthMethod: null,
      abhaAuthId: [null, [
        Validators.required,
        Validators.pattern('^[0-9]*$')
      ]]
    });
  }
  
  closeDialogAuth() {
    this.dialogRef.close();
    this.abhaAuthMethodForm.reset();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getAbhaAuthMethod(){
    const authMode = this.abhaAuthMethodForm.controls['modeofAuthMethod'].value;
    if(authMode === "AADHAAR"){
      this.enterAuthIdLabel = this.currentLanguageSet.enterABHANumberOrAadhar;
      this.enableAuthIdField = true;
    } else if(authMode === "MOBILE") {
      this.enterAuthIdLabel = this.currentLanguageSet.enterABHANumberOrAadhar;
      this.enableAuthIdField = true;
    }
  }

  checkAbhaIdType(){
    const authMode = this.abhaAuthMethodForm.controls['modeofAuthMethod'].value;
    const abhaAuthId = this.abhaAuthMethodForm.controls['abhaAuthId'].value;
    let loginHint = null;
    let loginMethod: any = null;
    if(authMode === "AADHAAR" && (abhaAuthId.length === 14 || abhaAuthId.length === 17)){
      loginHint = "abha";
      loginMethod = "aadhaar";
      this.requestOtpForAbhaLogin(loginHint, loginMethod);
    } else if(authMode === "AADHAAR" && abhaAuthId.length === 12){
      loginHint = "aadhaar";
      loginMethod = "aadhaar";
      this.requestOtpForAbhaLogin(loginHint, loginMethod);
    }  else if(authMode === "MOBILE" && (abhaAuthId.length === 14 || abhaAuthId.length === 17)){
      loginHint = "abha";
      loginMethod = "mobile";
      this.requestOtpForAbhaLogin(loginHint, loginMethod);
    } else if(authMode === "MOBILE" && abhaAuthId.length === 10) {
      loginHint = "mobile";
      loginMethod = "mobile";
      this.requestOtpForAbhaLogin(loginHint, loginMethod);
    } else {
      this.confirmationValService.alert(this.currentLanguageSet.enterCorrectAuthIdForAuthMode, 'error');
    }
  }

  requestOtpForAbhaLogin(loginHint: any, loginMethod: any){
    let reqObj = {
      loginHint: loginHint,
      loginMethod: loginMethod,
      loginId: this.abhaAuthMethodForm.controls['abhaAuthId'].value
    }
    this.registrarService.requestOtpForAbhaLogin(reqObj).subscribe((res:any) => {
      if(res.statusCode === 200 && res.data){
        let txnId = res.data.txnId;
        let message = res.data.message;
        this.dialogRef.close();
        this.confirmationValService.alert(message, 'success').afterClosed().subscribe(result => {
          if(result){
            this.routeToEnterOtpPage(txnId, loginMethod, loginHint);
          }
        })
      } else {
        this.confirmationValService.alert(res.errorMessage, 'error');
      }
    }, (err: any) => {
      this.confirmationValService.alert(err.errorMessage, 'error');
    });
  }

  routeToEnterOtpPage(txnId: any, loginMethod:any, loginHint: any){
    const dialogRef = this.dialog.open(AbhaEnterOtpComponentComponent, {
      height: '250px',
      width: '420px',
      data: {
        txnId: txnId,
        loginMethod: loginMethod,
        loginHint: loginHint,
        aadharNumber: this.abhaAuthMethodForm.controls['abhaAuthId'].value
      },
    });
    this.dialogRef.afterClosed();
  }

  checkValidHealthID() {
    const healthidval = this.abhaAuthMethodForm.controls['abhaAuthId'].value;
  
    if (healthidval.length === 12 && /^\d{12}$/.test(healthidval)) {
      return true; 
    }  else if (healthidval.length === 10 && /^\d{10}$/.test(healthidval)) {
      return true; 
    } else if (healthidval.length === 14 && /^\d{14}$/.test(healthidval)) {
      return true; // Valid Health ID without hyphens
    } else if (healthidval.length === 17 && /^(\d{2})-(\d{4})-(\d{4})-(\d{4})$/.test(healthidval)) {
      return true; // Valid Health ID with hyphens
    }
    let healthIDPattern;
    if(environment.abhaExtension === '@abdm'){
    healthIDPattern =  /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{4})$/  // ABHA pattern with 4 letter domain
    } else {
    healthIDPattern =  /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{3})$/;  // ABHA pattern with 3 letter domain - i.e., sbx
    }
  
    if (healthIDPattern.test(healthidval)) {
      return true; 
    }
  
    // If none of the conditions match, show error
    this.idErrorText = 'Please enter a valid Health ID / Aadhaar Number / Mobile Number';
    return false; // Invalid
  }
  

}
