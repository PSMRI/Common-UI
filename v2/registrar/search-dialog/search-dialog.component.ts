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

import { Component, OnInit, ChangeDetectorRef, DoCheck } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ZardDialogRef } from 'Common-UI/v2/ui/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { CommonService } from 'src/app/app-modules/core/services/common-services.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from 'Common-UI/v2/registrar/services/registrar.service';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from '../services/session-storage.service';
import { Subscription } from 'rxjs';
import { NgIf, NgFor } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import {
  ZardSelectComponent,
  ZardSelectItemComponent,
} from 'Common-UI/v2/ui/select';
import { ZardComboboxComponent } from 'Common-UI/v2/ui/combobox';
import { ZardDatePickerComponent } from 'Common-UI/v2/ui/date-picker';

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
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardComboboxComponent,
    ZardDatePickerComponent,
  ],
  viewProviders: [provideIcons({ lucideX })],
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
  blockList: any[] = [];

  blockID: any;
  villageID: any;
  villageList: any[] = [];

  stateCtrl = new FormControl();
  districtCtrl = new FormControl();
  blockCtrl = new FormControl();
  villageCtrl = new FormControl();

  private readonly cascadeSubscriptions: Subscription[] = [];

  constructor(
    private confirmationService: ConfirmationService,
    public matDialogRef: ZardDialogRef<SearchDialogComponent>,
    public commonService: CommonService,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private sessionstorage: SessionStorageService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.newSearchForm = this.createBeneficiaryForm();
    // Call For MAster Data which will be loaded in Sub Components
    this.callMasterDataObservable();
    this.getStatesData(); //to be called from masterobservable method layter
    this.today = new Date();

    // The z-combobox commits the picked option's value (the *Name string, via
    // zValueKey) to its FormControl through ControlValueAccessor; subscribing to
    // valueChanges and resolving the full object replaces the old
    // mat-autocomplete (optionSelected) handler.
    this.cascadeSubscriptions.push(
      this.stateCtrl.valueChanges.subscribe((name: any) =>
        this.onStateSelected(this.findByKey(this.states, 'stateName', name)),
      ),
      this.districtCtrl.valueChanges.subscribe((name: any) =>
        this.onDistrictSelected(
          this.findByKey(this.districts, 'districtName', name),
        ),
      ),
      this.blockCtrl.valueChanges.subscribe((name: any) =>
        this.onBlockSelected(this.findByKey(this.blockList, 'blockName', name)),
      ),
      this.villageCtrl.valueChanges.subscribe((name: any) =>
        this.onVillageSelected(
          this.findByKey(this.villageList, 'villageName', name),
        ),
      ),
    );
  }

  private findByKey(list: any[], key: string, value: any): any {
    if (!value || !list) return null;
    return list.find(option => option[key] === value);
  }

  onStateSelected(state: any) {
    if (!state) return;
    this.newSearchForm.get('stateID')?.setValue(state.stateID);
    // Call service directly
    this.registrarService
      .getDistrictList(state.stateID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.districts = res.data;
          this.districtCtrl.setValue(''); // clear district field
          this.blockCtrl.setValue(''); // clear block field
          this.villageCtrl.setValue(''); // clear village field
          this.blockList = [];
          this.villageList = [];
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issueFetching,
            'error',
          );
        }
      });
  }

  onDistrictSelected(district: any) {
    if (!district) return;
    this.newSearchForm.get('districtID')?.setValue(district.districtID);
    // Call service directly
    this.registrarService
      .getSubDistrictList(district.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.blockList = res.data;
          this.blockCtrl.setValue(''); // clear block field
          this.villageCtrl.setValue(''); // clear village field
          this.villageList = [];
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.IssuesInFetchingDemographics,
            'error',
          );
        }
      });
  }

  onBlockSelected(block: any) {
    if (!block) return;
    this.newSearchForm.get('blockID')?.setValue(block.blockID);
    // Call service directly
    this.registrarService.getVillageList(block.blockID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.villageList = res.data;
        this.villageCtrl.setValue(''); // clear village field
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.IssuesInFetchingLocationDetails,
          'error',
        );
      }
    });
  }

  onVillageSelected(village: any) {
    if (!village) return;
    this.newSearchForm.get('villageID')?.setValue(village.districtBranchID);
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
      blockID: [null],
      villageID: [null],
    });
  }
  resetBeneficiaryForm() {
    this.newSearchForm.reset();

    // Reset the combobox FormControls
    this.stateCtrl.setValue('');
    this.districtCtrl.setValue('');
    this.blockCtrl.setValue('');
    this.villageCtrl.setValue('');

    // Clear the lists so dropdowns are empty
    this.districts = [];
    this.blockList = [];
    this.villageList = [];

    this.getStatesData();
  }

  /**
   * Coerce the z-select string value back to a number so the genderID stored in
   * the form matches the numeric IDs the search payload expects.
   */
  onGenderSelected(value: string | string[]) {
    const id = Array.isArray(value) ? value[0] : value;
    this.newSearchForm.get('gender')?.setValue(id == null ? null : Number(id));
    this.selectGender();
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
  }

  /**
   * combining Govt ID lists
   */

  govtIDData() {
    const govID = this.masterData.govIdEntityMaster;
    const otherGovID = this.masterData.otherGovIdEntityMaster;

    otherGovID.forEach((element: any) => {
      govID.push(element);
    });
    this.govtIDs = govID;
  }

  onIDCardSelected() {}

  /**
   * get states from localstorage and set default state
   */
  getStatesData() {
    const location: any = this.sessionstorage.getItem('location');
    this.locations = JSON.parse(location);
    console.log(location, 'gotit');
    if (location) {
      this.states = this.locations.stateMaster;
      if (location.otherLoc) {
        this.newSearchForm.controls['stateID'] =
          this.locations.otherLoc.stateID;
        this.newSearchForm.controls['districtID'] =
          this.locations.otherLoc.districtList[0].districtID;
      }
    }
  }

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
        blockID: formValues.blockID,
        villageID: formValues.villageID,
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
