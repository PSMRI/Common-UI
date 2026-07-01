/*
 * AMRIT – Accessible Medical Records via Integrated Technologies
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
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { RegistrarService } from '../../services/registrar.service';
import { RdDeviceService } from '../../services/rddevice.service';
import { concatMap } from 'rxjs';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideFingerprint } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';

@Component({
  selector: 'app-biometric-authentication',
  templateUrl: './biometric-authentication.component.html',
  standalone: true,
  imports: [NgIcon, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideX, lucideFingerprint })],
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
            console.log('rdservice captures:', this.rddeviceService.capturePID);
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
