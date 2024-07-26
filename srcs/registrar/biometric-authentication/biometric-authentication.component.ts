import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { RegistrarService } from '../services/registrar.service';
import { GenerateMobileOtpGenerationComponent } from '../generate-mobile-otp-generation/generate-mobile-otp-generation.component';
import { HealthIdOtpSuccessComponent } from '../health-id-otp-generation/health-id-otp-generation.component';
import { RdDeviceService } from '../services/rddevice.service';
import { concatMap } from 'rxjs';

@Component({
  selector: 'app-biometric-authentication',
  templateUrl: './biometric-authentication.component.html',
  styleUrls: ['./biometric-authentication.component.css'],
})
export class BiometricAuthenticationComponent implements OnInit {
  transactionId: any;
  aadharBioNum: any;
  captureres: any;
  capturePID: any;
  showProgressBar: boolean = false;

  constructor(
    public matDialogRef: MatDialogRef<BiometricAuthenticationComponent>,
    private rddeviceService: RdDeviceService,
    private registrarService: RegistrarService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    console.log('success');
    this.aadharBioNum = this.data.aadharNumber;
  }

  captureData() {
    this.rddeviceService
      .discoverAvdm()
      .pipe(
        concatMap(() => this.rddeviceService.getDeviceInfo()),
        concatMap(() => this.rddeviceService.captureAvdm()),
      )
      .subscribe(
        (captureres) => {
          console.log(captureres, 'CAPTURE DATA');
          if (captureres != null) {
            // Assign captureres to capturePID
            this.rddeviceService.capturePID = captureres;
            this.matDialogRef.close(captureres);
            if (this.aadharBioNum != null && this.aadharBioNum != undefined) {
              this.showProgressBar = true;
              this.generateAbha(); // Call generateAbha after setting capturePID
            } else {
              this.rddeviceService.capturePID = captureres;
            }
          }
        },
        (error) => {
          console.error('Error capturing data:', error);
        },
      );
  }

  generateAbha() {
    let reqObj = {
      aadhaar: this.aadharBioNum,
      bioType: 'FMR',
      pid: this.rddeviceService.capturePID,  // Access capturePID from rddeviceService
    };
    this.registrarService
      .generateABHAForBiometric(reqObj)
      .subscribe((res: any) => {
        if (res.statusCode == 200 && Object.keys(res.data).length > 0) {
          this.transactionId = res.data.txnId;
          this.generateMobileOTPForBio();
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      });
  }

  generateMobileOTPForBio() {
    let dialogRefMobile = this.dialog.open(
      GenerateMobileOtpGenerationComponent,
      {
        height: '250px',
        width: '420px',
        disableClose: true,
        data: { transactionId: this.transactionId, bioValue: true },
      },
    );
    dialogRefMobile.afterClosed().subscribe((response) => {
      if (response != undefined && response != null) {
        this.transactionId = response;
        this.posthealthIDButtonCall();
      }
    });
  }

  posthealthIDButtonCall() {
    let reqObj = {
      email: this.data.email,
      firstName: this.data.firstName,
      middleName: this.data.middleName,
      lastName: this.data.lastName,
      txnId: this.transactionId,
      profilePhoto: this.data.profilePhoto,
      healthId: this.data.healthId,
      createdBy: localStorage.getItem('userName'),
      providerServiceMapID: localStorage.getItem('providerServiceID'),
    };
    console.log(reqObj, "MY ABHA REQUEST OBJ");
    this.registrarService.generateHealthIdWithUID(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode == 200 && res.data) {
          this.registrarService.abhaGenerateData = res.data;
          console.log(this.registrarService.abhaGenerateData, "MY ABHA STORED RES");
          this.registrarService.aadharNumberNew = this.aadharBioNum;
          this.registrarService.getabhaDetail(true);
          let dialogRefSuccess = this.dialog.open(HealthIdOtpSuccessComponent, {
            height: '300px',
            width: '420px',
            disableClose: true,
            data: res,
          });
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
              // this.dialogSucRef.close(dat);
          });
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationService.alert(
          'Issue In Getting Beneficiary ABHA Details',
          'error',
        );
      },
    );
  }

  closeDialog() {
    this.matDialogRef.close();
  }
}
