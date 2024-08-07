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

import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  AfterViewChecked,
  DoCheck,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { CommonService } from 'src/app/app-modules/core/services/common-services.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from 'Common-UI/src/registrar/services/registrar.service';
import { environment } from 'src/environments/environment';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';

interface Beneficary {
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  gender: string;
  genderName: string;
  govtIDtype: string;
  govtIDvalue: string;
  stateID: string;
  districtID: string;
}

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.css'],
  providers: [
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
export class SearchDialogComponent implements OnInit, DoCheck {
  // for ID Manpulation
  masterData: any;
  masterDataSubscription: any;

  beneficiary!: Beneficary;
  states: any;
  districts: any;
  stateID: any;
  districtID: any;
  govtIDs: any;
  countryId = environment.countryId;
  // @ViewChild('newSearchForm') form: any;

  today!: Date;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;
  locations: any;

  newSearchForm!: FormGroup;
  maxDate = new Date();

  constructor(
    private confirmationService: ConfirmationService,
    public matDialogRef: MatDialogRef<SearchDialogComponent>,
    public commonService: CommonService,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.newSearchForm = this.createBeneficiaryForm();

    // Call For MAster Data which will be loaded in Sub Components
    this.callMasterDataObservable();
    this.getStatesData(); //to be called from masterobservable method layter
    this.today = new Date();
  }

  AfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  createBeneficiaryForm() {
    return this.fb.group({
      firstName: [null, Validators.required],
      lastName: [null],
      fatherName: [null],
      dob: [null],
      gender: [null, Validators.required],
      stateID: [null, Validators.required],
      districtID: [null, Validators.required],
    });
  }

  resetBeneficiaryForm() {
    this.newSearchForm.reset();
    this.getStatesData();
  }

  /**
   *
   * Call Master Data Observable
   */
  callMasterDataObservable() {
    this.registrarService.getRegistrationMaster(this.countryId);
    this.loadMasterDataObservable();
  }

  /**
   *
   * Load Master Data of Id Cards as Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe(res => {
        console.log('Registrar master data', res);
        if (res !== null) {
          this.masterData = Object.assign({}, res);
          console.log(this.masterData, 'masterDataall');
          this.getStatesData();
          this.govtIDData();
        }
      });
  }

  /**
   * select gender Name from id
   */
  selectGender() {
    const genderMaster = this.masterData.genderMaster;
    genderMaster.forEach((element: any) => {
      if (element.genderID === this.newSearchForm.controls['gender']) {
        this.newSearchForm.controls['genderName'] = element.genderName;
      }
    });
    console.log(this.newSearchForm.controls, 'csdvde');
  }

  /**
   * combining Govt ID lists
   */

  govtIDData() {
    console.log(this.masterData, 'govtidddds');
    const govID = this.masterData.govIdEntityMaster;
    const otherGovID = this.masterData.otherGovIdEntityMaster;

    otherGovID.forEach((element: any) => {
      govID.push(element);
    });
    this.govtIDs = govID;
    console.log(this.govtIDs, 'idsss');
  }

  onIDCardSelected() {}

  /**
   * get states from localstorage and set default state
   */
  getStatesData() {
    const location: any = localStorage.getItem('location');
    this.locations = JSON.parse(location);
    console.log(location, 'gotit');
    if (location) {
      this.states = this.locations.stateMaster;
      if (location.otherLoc) {
        this.newSearchForm.controls['stateID'] =
          this.locations.otherLoc.stateID;
        this.newSearchForm.controls['districtID'] =
          this.locations.otherLoc.districtList[0].districtID;
        this.onStateChange();
      }
    }
  }

  onStateChange() {
    const stateIDVal: any = this.newSearchForm.controls['stateID'].value;
    if (stateIDVal) {
      this.registrarService
        .getDistrictList(stateIDVal)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.districts = res.data;
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.issueFetching,
              'error'
            );
            this.matDialogRef.close(false);
          }
        });
    }
  }
  // getStates() {
  //   this.commonService.getStates(this.countryId).subscribe(res => {this.states = res});

  // }

  getDistricts(stateID: any) {
    this.commonService.getDistricts(stateID).subscribe(res => {
      this.districts = res;
    });
  }

  beneficiaryList: any = [];
  dataObj: any;
  getSearchResult(formValues: any) {
    this.dataObj = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      fatherName: formValues.fatherName,
      dob: formValues.dob,
      genderID: formValues.gender,
      i_bendemographics: {
        stateID: formValues.stateID,
        districtID: formValues.districtID,
      },
    };
    //Passing form data to component and closing the dialog
    this.matDialogRef.close(this.dataObj);
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
