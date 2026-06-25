/*
 * AMRIT – Accessible Medical Records via Integrated Technology
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
import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from '../../services/session-storage.service';
import { DownloadSearchAbhaComponent } from '../download-search-abha/download-search-abha.component';

@Component({
  selector: 'app-health-id-display-modal',
  templateUrl: './health-id-display-modal.component.html',
  styleUrls: ['./health-id-display-modal.component.css'],
  providers: [
    {
      provide: DatePipe,
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class HealthIdDisplayModalComponent implements OnInit, DoCheck {
  chooseHealthID: any;
  currentLanguageSet: any;
  healthIDMapped: any;
  benDetails: any;
  healthIDMapping = false;
  selectedHealthID: any;
  showProgressBar = false;
  searchPopup = false;

  displayedColumns: any = [
    'sno',
    'abhaNumber',
    'abha',
    'dateOfCreation',
    'abhaMode',
  ];
  searchDetails = new MatTableDataSource<any>();

  displayedColumns1: any = [
    'sno',
    'abhaNumber',
    'abha',
    'dateOfCreation',
    'abhaMode',
    'action',
  ];
  displayedColumns2: any = [
    'sno',
    'healthIDNo',
    'healthID',
    'createdDate',
    'healthIDMode',
    'rblMode',
  ];
  healthIDArray = new MatTableDataSource<any>();

  constructor(
    public dialogRef: MatDialogRef<HealthIdDisplayModalComponent>,
    @Inject(MAT_DIALOG_DATA) public input: any,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private datePipe: DatePipe,
    private dialogMd: MatDialog,
    private sessionstorage: SessionStorageService,
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    console.log("this.input", this.input);
    this.searchDetails.data = [];
    this.selectedHealthID = null;
    this.searchPopup = false;
    this.assignSelectedLanguage();
    this.searchPopup =
      this.input.search !== undefined ? this.input.search : false;
    this.healthIDMapping = this.input.healthIDMapping;
    console.log("this.healthIDMapping", this.healthIDMapping);
    if (
      this.input.dataList !== undefined &&
      this.input.search === true
    ) {
      let tempVal: any = this.input.dataList;
      this.benDetails = this.input.dataList;
      let tempCreatDate: any = this.input.dataList.createdDate;
      console.log("tempVal", tempVal);
        this.searchDetails.data.push(tempVal);
        console.log("this.searchDetails.data%%", this.searchDetails.data)

    }
    if (this.input.dataList !== undefined &&
      this.input.dataList.data?.BenHealthDetails !== undefined
    ){
      this.benDetails = this.input.dataList.data.BenHealthDetails;
      console.log("this.benDetails1",this.benDetails)
    }
    this.createList();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  createList() {
    if (this.benDetails.length > 0) {
      this.benDetails.forEach((healthID: any) => {
        healthID.createdDate = this.datePipe.transform(
          healthID.createdDate,
          'yyyy-MM-dd hh:mm:ss a',
        );
        this.healthIDArray.data.push(healthID);
      });
    }
  }

  onRadioChange(data: any) {
    this.selectedHealthID = data;
  }
  linkCareContextV3() {
    this.showProgressBar = true;
    const abdmFacilityId = this.sessionstorage.getItem('abdmFacilityId');
    const abdmFacilityName = this.sessionstorage.getItem('abdmFacilityName');
    const tokenReqObj = {
      abhaNumber: this.selectedHealthID.healthIdNumber
        ? this.selectedHealthID.healthIdNumber
        : null,
      abhaAddress: this.selectedHealthID.healthId
        ? this.selectedHealthID.healthId
        : null,
      name: this.selectedHealthID.name ? this.selectedHealthID.name : null,
      gender: this.selectedHealthID.gender
        ? this.selectedHealthID.gender
        : null,
      yearOfBirth: this.selectedHealthID.yearOfBirth
        ? parseInt(this.selectedHealthID.yearOfBirth, 10)
        : null,
      abdmFacilityId:
        abdmFacilityId !== null &&
        abdmFacilityId !== undefined &&
        abdmFacilityId !== ''
          ? abdmFacilityId
          : null,
    };
    this.registrarService
      .generateLinkTokenForCareContext(tokenReqObj)
      .subscribe(
        (tokenResponse: any) => {
          if (tokenResponse.statusCode === 200 && tokenResponse.data) {
            const linkToken =
              tokenResponse.data['X-LINK-TOKEN'] ||
              tokenResponse.data['linkToken'];
            if (!linkToken) {
              this.showProgressBar = false;
              this.confirmationService.alert(
                tokenResponse.data['error'] ||
                  'Failed to generate link token',
                'error',
              );
              return;
            }
            const visitCategory =
              this.sessionstorage.getItem('visitCategory') ===
              'General OPD (QC)'
                ? 'Emergency'
                : this.sessionstorage.getItem('visitCategory');
            const linkReqObj = {
              beneficiaryID: this.selectedHealthID.beneficiaryRegID,
              abhaAddress: this.selectedHealthID.healthId
                ? this.selectedHealthID.healthId
                : null,
              abhaNumber: this.selectedHealthID.healthIdNumber
                ? this.selectedHealthID.healthIdNumber
                : null,
              linkToken: linkToken,
              requestId: tokenResponse.data['requestId'] || null,
              visitCode: this.input.visitCode,
              visitCategory: visitCategory,
              abdmFacilityId:
                abdmFacilityId !== null &&
                abdmFacilityId !== undefined &&
                abdmFacilityId !== ''
                  ? abdmFacilityId
                  : null,
              abdmFacilityName:
                abdmFacilityName !== null &&
                abdmFacilityName !== undefined &&
                abdmFacilityName !== ''
                  ? abdmFacilityName
                  : null,
            };
            this.registrarService.linkCareContextV3(linkReqObj).subscribe(
              (linkResponse: any) => {
                this.showProgressBar = false;
                if (
                  linkResponse.statusCode === 200 &&
                  linkResponse.data?.message
                ) {
                  this.confirmationService.alert(
                    linkResponse.data.message,
                    'success',
                  );
                  this.closeDialog();
                } else {
                  this.confirmationService.alert(
                    linkResponse.errorMessage ||
                      linkResponse.data?.error ||
                      'Failed to link care context',
                    'error',
                  );
                }
              },
              (err: any) => {
                this.showProgressBar = false;
                this.confirmationService.alert(
                  err.errorMessage || 'Failed to link care context',
                  'error',
                );
              },
            );
          } else {
            this.showProgressBar = false;
            this.confirmationService.alert(
              tokenResponse.errorMessage || 'Failed to generate link token',
              'error',
            );
          }
        },
        (err: any) => {
          this.showProgressBar = false;
          this.confirmationService.alert(
            err.errorMessage || 'Failed to generate link token',
            'error',
          );
        },
      );
  }
  closeDialog() {
    this.dialogRef.close();
  }

  printHealthIDCard(data: any) {
    const dialogRefValue = this.dialogMd.open(DownloadSearchAbhaComponent, {
      height: '330px',
      width: '500px',
      disableClose: true, 
      data: {
        printCard: true,
        healthId: data.healthId 
      }
    });
  }
}
