import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { RegistrarService } from '../../services/registrar.service';
import { RdDeviceService } from '../../services/rddevice.service';
import { concatMap } from 'rxjs';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

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
  healthDataNum: any;
  pidRes: any;
  healthIDCard: any;
  showProgressBar: boolean = false;
  currentLanguageSet: any;

  constructor(
    public matDialogRef: MatDialogRef<BiometricAuthenticationComponent>,
    private rddeviceService: RdDeviceService,
    private registrarService: RegistrarService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    console.log('success');
    this.assignSelectedLanguage();
    this.aadharBioNum = this.data.aadharNumber;
    this.healthDataNum = this.data.healthid;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
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
            console.log("rdservice captures:", this.rddeviceService.capturePID)
            this.matDialogRef.close(this.rddeviceService.capturePID);
          }
        },
        (error) => {
          console.error('Error capturing data:', error);
        },
      );
  }

  closeDialog() {
    this.matDialogRef.close();
  }
}
