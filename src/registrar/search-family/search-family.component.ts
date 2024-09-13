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
  Inject,
  HostListener,
  DoCheck,
} from '@angular/core';
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { CommonService } from 'src/app/app-modules/core/services/common-services.service';
import { RegistrarService } from '../services/registrar.service';
import { FamilyTaggingService } from '../services/familytagging.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

interface Beneficary {
  village: string;
  villageID: string;
  districtID: string;
  blockID: string;
  surname: string;
  familyId: string;
}

@Component({
  selector: 'app-search-family',
  templateUrl: './search-family.component.html',
  styleUrls: ['./search-family.component.css'],
})
export class SearchFamilyComponent implements OnInit, DoCheck {
  masterData: any;
  masterDataSubscription: any;
  surname: any;
  villageID: any;

  familyIds: any;

  beneficiary!: Beneficary;
  familySearchForm!: FormGroup;
  currentLanguageSet: any;
  today!: Date;
  disableState = true;
  disableDistrict = true;
  disableBlock = false;

  familyDetails: any;
  districtList: any;
  blockList: any;
  villageList: any;
  statesList: any;
  stateValue: any;
  benDistrictId: any;
  benBlockId: any;
  benVillageId: any;
  showProgressBar = false;

  constructor(
    private confirmationService: ConfirmationService,
    private formBuilder: FormBuilder,
    public httpServiceService: HttpServiceService,
    public matDialogRef: MatDialogRef<SearchFamilyComponent>,
    public commonService: CommonService,
    private router: Router,
    private registrarService: RegistrarService,
    private changeDetectorRef: ChangeDetectorRef,
    private familyTaggingService: FamilyTaggingService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.showProgressBar = true;
    this.createFamilySearchForm();
    this.assignSelectedLanguage();
    console.log('this.familySearchForm line 107', this.familySearchForm.value);
    if (this.data !== null && this.data !== undefined) {
      this.familySearchForm.controls['surname'].setValue(
        this.data.benSurname !== undefined &&
          this.data.benSurname !== null &&
          this.data.benSurname !== 'null' &&
          this.data.benSurname !== ''
          ? this.data.benSurname
          : null
      );
      this.benDistrictId = parseInt(this.data.benDistrictId);
      this.benBlockId = parseInt(this.data.benBlockId);
      this.benVillageId = parseInt(this.data.benVillageId);
    }

    this.fetchDistrictsOnStateSelection();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  createFamilySearchForm() {
    this.familySearchForm = this.formBuilder.group({
      villageID: [null, Validators.required],
      districtID: [null, Validators.required],
      blockID: [null, Validators.required],
      surname: [null, Validators.required],
      familyId: null,
    });
  }

  getFamilySearchMaster() {
    const requestObj = {
      villageId: this.familySearchForm.value.villageID,
      districtId: this.familySearchForm.value.districtID,
      blockId: this.familySearchForm.value.blockID,
      familyName: this.familySearchForm.value.surname,
      familyId: this.familySearchForm.value.familyId,
    };

    this.familyTaggingService
      .benFamilySearch(requestObj)
      .subscribe((res: any) => {
        if (
          res &&
          res.statusCode === 200 &&
          res.data &&
          res.data.response === undefined
        ) {
          this.familyDetails = res.data;
          this.matDialogRef.close({
            familyDetails: this.familyDetails,
            searchRequest: requestObj,
          });
        } else {
          this.confirmationService.alert(res.data.response, 'info');
          this.matDialogRef.close(null); // if no record is found than the result is passing as null
        }
        (err: string) => {
          this.confirmationService.alert(err, 'error');
          this.matDialogRef.close(false);
        };
      });
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  onVillageChange() {
    this.updateVillageName();
  }

  updateVillageName() {
    this.villageList.find((village: any) => {
      if (village.districtBranchID === this.familySearchForm.value.villageID) {
        this.familySearchForm.patchValue({
          villageName: village.villageName,
        });
      }
    });
  }

  onBlockChange() {
    this.registrarService
      .getVillageList(this.familySearchForm.value.blockID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.villageList = res.data;
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
            'error'
          );
        }
      });
  }

  emptyDistrict() {
    this.familySearchForm.patchValue({
      districtID: null,
      districtName: null,
    });
  }

  emptyVillage() {
    this.familySearchForm.patchValue({
      villageID: null,
      villageName: null,
    });
  }

  emptyBlock() {
    this.familySearchForm.patchValue({
      blockID: null,
      blockName: null,
    });
  }

  emptyState() {
    this.familySearchForm.patchValue({
      stateID: null,
      stateName: null,
    });
  }

  onDistrictChange() {
    this.fetchBlockSelection();
  }

  fetchBlockSelection() {
    console.log(
      'this.familySearchForm.value.districtID in 288',
      this.familySearchForm.value
    );
    this.registrarService
      .getSubDistrictList(this.familySearchForm.value.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.blockList = res.data;
          this.emptyBlock();
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  fetchDistrictsOnStateSelection() {
    const stateId = this.registrarService.stateIdFamily;
    this.registrarService.getDistrictList(stateId).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.districtList = res.data;
        this.emptyDistrict();
        this.emptyBlock();
        this.emptyVillage();

        this.familySearchForm.controls['districtID'].setValue(
          this.benDistrictId !== undefined && this.benDistrictId !== null
            ? this.benDistrictId
            : null
        );
        this.fetchBlockSelectionInitial();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
          'error'
        );
      }
    });
  }

  fetchBlockSelectionInitial() {
    console.log(
      'this.familySearchForm.value.districtID in 330',
      this.familySearchForm.value
    );
    this.registrarService
      .getSubDistrictList(this.familySearchForm.value.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.blockList = res.data;
          this.emptyBlock();
          this.emptyVillage();
          this.familySearchForm.controls['blockID'].setValue(
            this.benBlockId !== undefined && this.benBlockId !== null
              ? this.benBlockId
              : null
          );
          this.onBlockChangeInitial();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  onBlockChangeInitial() {
    this.registrarService
      .getVillageList(this.familySearchForm.value.blockID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.villageList = res.data;
          this.emptyVillage();
          this.familySearchForm.controls['villageID'].setValue(
            this.benVillageId !== undefined && this.benVillageId !== null
              ? this.benVillageId
              : null
          );
          this.showProgressBar = false;
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
            'error'
          );
        }
      });
  }

  onClose() {
    this.matDialogRef.close();
  }

  dataObj: any;
  getSearchResult(formValues: any) {
    this.dataObj = {
      villageID: formValues.village,
    };
  }

  @HostListener('document:keypress', ['$event'])
  startSearch(event: KeyboardEvent) {
    if (event.code === 'Enter') {
      if (this.familySearchForm.valid) {
        this.getFamilySearchMaster();
      }
    }
  }
}
