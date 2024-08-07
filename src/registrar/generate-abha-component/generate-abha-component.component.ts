import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HealthIdOtpGenerationComponent } from '../health-id-otp-generation/health-id-otp-generation.component';
import { BiometricAuthenticationComponent } from '../biometric-authentication/biometric-authentication.component';
import { RegistrationUtils } from '../utility/registration-utility';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../services/registrar.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

@Component({
  selector: 'app-generate-abha-component',
  templateUrl: './generate-abha-component.component.html',
  styleUrls: ['./generate-abha-component.component.css'],
})
export class GenerateAbhaComponentComponent implements OnInit {
  utils = new RegistrationUtils(this.fb);

  abhaGenerateForm!: FormGroup;
  currentLanguageSet: any;
  modeofAbhaHealthID: any;
  aadharNumber: any;
  disableGenerateOTP!: boolean;

  constructor(
    public dialogRef: MatDialogRef<GenerateAbhaComponentComponent>,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private confirmationValService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
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
      modeofAbhaHealthID: null,
      aadharNumber: null,
    });
  }

  resetAbhaValidateForm() {
    this.abhaGenerateForm.patchValue({
      aadharNumber: null,
    });
    this.abhaGenerateForm.patchValue({
      modeofAbhaHealthID: null,
    });
  }

  getAbhaValues() {
    this.modeofAbhaHealthID =
      this.abhaGenerateForm.controls['modeofAbhaHealthID'].value;
    this.aadharNumber = this.abhaGenerateForm.controls['aadharNumber'].value;
  }

  generateABHACard() {
    this.dialogRef.close();
    this.modeofAbhaHealthID =
      this.abhaGenerateForm.controls['modeofAbhaHealthID'].value;
    this.aadharNumber = this.abhaGenerateForm.controls['aadharNumber'].value;
    if (this.modeofAbhaHealthID === 'AADHAR') {
      this.generateHealthIDCard();
      this.getOTP();
    } else if (this.modeofAbhaHealthID === 'BIOMETRIC') {
      const mdDialogRef: MatDialogRef<BiometricAuthenticationComponent> =
        this.dialog.open(BiometricAuthenticationComponent, {
          width: '500px',
          height: '320px',
          disableClose: true,
          data: {aadharNumber: this.aadharNumber}
        });
      mdDialogRef.afterClosed().subscribe((res) => {});
    }
  }

  generateHealthIDCard() {
    const id = {
      aadharNumber: this.aadharNumber,
      healthIdMode: this.modeofAbhaHealthID,
    };
    this.registrarService.passIDsToFetchOtp(id);
  }

  getOTP() {
    const dialogRef = this.dialog.open(HealthIdOtpGenerationComponent, {
      height: '250px',
      width: '420px',
      data: {
        aadharNumber: this.aadharNumber,
        healthIdMode: this.modeofAbhaHealthID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('resultGoldy', result);
      if (result) {
        (<FormGroup>(
          this.abhaGenerateForm.controls['otherDetailsForm']
        )).patchValue({ healthId: result.healthId });
        (<FormGroup>(
          this.abhaGenerateForm.controls['otherDetailsForm']
        )).patchValue({ healthIdNumber: result.healthIdNumber });

        (<FormGroup>(
          this.abhaGenerateForm.controls['otherDetailsForm']
        )).controls['healthId'].disable();
        this.disableGenerateOTP = true;
      }
    });
  }
}

@Component({
  selector: 'auth-method',
  templateUrl: './auth-method.html',
  styleUrls: ['./generate-abha-component.component.css']
})
export class authMethodComponent implements OnInit {
  authOption: boolean = false;
  modeofAuthMethod: any;
  abhaAuthMethodForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<authMethodComponent>,
    private registerService: RegistrarService,
  ) {}

ngOnInit(): void {
  this.abhaAuthMethodForm = this.createAbhaAuthMethod();
}

createAbhaAuthMethod() {
  return this.fb.group({
    modeofAuthMethod: null,
  });
}

closeDialogAuth() {
  this.dialogRef.close();
  this.modeofAuthMethod = null;
}

getAbhaAuthMethod(){
  this.modeofAuthMethod=this.abhaAuthMethodForm.controls["modeofAuthMethod"].value;
  this.dialogRef.close(this.modeofAuthMethod);
  console.log("AUTH METHOD", this.modeofAuthMethod);
}
}
