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
  ChangeDetectorRef,
  ViewChild,
  DoCheck,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService, CameraService, BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from 'Common-UI/srcs/registrar/services/registrar.service';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';

export interface Consent {
  consentGranted: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, DoCheck {
  rowsPerPage = 5;
  activePage = 1;
  pagedList = [];
  rotate = true;
  beneficiaryList: any;
  filteredBeneficiaryList: any = [];
  quicksearchTerm: any;
  advanceSearchTerm: any;
  blankTable = [1, 2, 3, 4, 5];
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;
  searchPattern!: string;
  consentGranted: any;
  displayedColumns: string[] = [
    'edit',
    'beneficiaryID',
    'benName',
    'genderName',
    'age',
    'fatherName',
    'districtVillage',
    'phoneNo',
    'registeredOn',
    'image',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();
  // searchType: string;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private registrarService: RegistrarService,
    private cameraService: CameraService,
    private router: Router,
    private beneficiaryDetailsService: BeneficiaryDetailsService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.searchPattern = '/^[a-zA-Z0-9](.|@|-)*$/;';
    // this.searchType = 'ID';
  }
  AfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  identityQuickSearch(searchTerm: any) {
    const searchObject = {
      beneficiaryRegID: null,
      beneficiaryID: null,
      phoneNo: null,
      HealthID: null,
      HealthIDNumber: null,
    };
    if (this.validateSearchItem(searchTerm, searchObject)) {
    this.registrarService.identityQuickSearch(searchObject).subscribe(
      (beneficiaryList: any) => {
        if (!beneficiaryList || beneficiaryList.length <= 0) {
          this.beneficiaryList = [];
          this.filteredBeneficiaryList = [];
          this.dataSource.data = [];
          console.log("this.dataSource.data1", this.dataSource.data);
          this.dataSource.paginator = this.paginator;
          // this.dataSource.data.forEach((sectionCount: any, index: number) => {
          //   sectionCount.sno = index + 1;
          // });
          this.pagedList = [];
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.beneficiarynotfound,
            'info'
          );
        } else {
          this.beneficiaryList = this.searchRestruct(
            beneficiaryList,
            searchObject
          );
          console.log("this.beneficiaryList2", this.beneficiaryList);
          this.filteredBeneficiaryList = this.beneficiaryList;
          this.dataSource.data = this.beneficiaryList;
          console.log("this.dataSource.data2", this.dataSource.data);
          this.dataSource.paginator = this.paginator;
        }
        console.log('hi', JSON.stringify(beneficiaryList, null, 4));
      },
      error => {
        this.confirmationService.alert(error, 'error');
      }
    );
    }
  }

  validateSearchItem(searchTerm: any, searchObject: any) {
    if (
      searchTerm === undefined ||
      searchTerm === null ||
      searchTerm.trim() === '' ||
      searchTerm.trim().length <= 0
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.pleaseEnterValidInput,
        'info',
      );
      return false;
    } else {
      if (
        searchTerm !== undefined &&
        searchTerm !== null &&
        searchTerm.trim().length >= 8 &&
        searchTerm.trim().length <= 32
      ) {
        if (
          searchTerm.trim().length === 10 ||
          searchTerm.trim().length === 12
        ) {
          return this.validatePhoneNumberOrBenID(
            searchTerm.trim(),
            searchObject,
          );
        } else if (
          searchTerm.trim().length === 14 ||
          searchTerm.trim().length === 17
        ) {
          return this.checkValidHealthIDNumber(searchTerm, searchObject);
        } else {
          return this.validateHealthIDPattern(searchTerm.trim(), searchObject);
        }
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.pleaseEnterValidInput,
          'info',
        );
        return false;
      }
    }
  }

  validatePhoneNumberOrBenID(searchTerm: any, searchObject: any) {
    const phoneNoPattern = /\d{10}$/;
    const verifyPhoneNoPattern = phoneNoPattern.test(searchTerm);
    if (verifyPhoneNoPattern) {
      searchObject['phoneNo'] =
        searchTerm.length === 10
          ? searchTerm
          : (searchObject['beneficiaryID'] = searchTerm);
      return true;
    } else {
      return this.validateHealthIDPattern(searchTerm, searchObject);
    }
  }

  validateSearchTerm(searchTerm: any, searchObject: any) {
    if (
      searchTerm === undefined ||
      searchTerm === null ||
      searchTerm.trim() === '' ||
      searchTerm.trim().length <= 0
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.pleaseEnterValidInput,
        'info',
      );
    } else {
      this.searchBeneficiaryDetails(searchTerm, searchObject);
    }
  }

  searchBeneficiaryDetails(searchTerm?: string, searchObject?: string) {
    if (
      searchTerm !== undefined &&
      searchTerm !== null &&
      searchTerm.trim().length >= 8 &&
      searchTerm.trim().length <= 32
    ) {
      let reqObj: any;
      if (
        searchTerm.trim().length === 10 &&
        searchObject?.toLowerCase() === 'phone no' &&
        searchTerm !== null &&
        searchTerm !== undefined
      ) {
        reqObj = {
          beneficiaryRegID: null,
          beneficiaryID: null,
          phoneNo: searchTerm,
          HealthID: null,
          HealthIDNumber: null,
          familyId: null,
          identity: null,
        };
        this.getSearchResult(reqObj, searchObject);
      } else if (
        searchTerm.trim().length === 12 &&
        searchObject?.toLowerCase() === 'beneficiary id' &&
        searchTerm !== null &&
        searchTerm !== undefined
      ) {
        reqObj = {
          beneficiaryRegID: null,
          beneficiaryID: searchTerm,
          phoneNo: null,
          HealthID: null,
          HealthIDNumber: null,
          familyId: null,
          identity: null,
        };
        this.getSearchResult(reqObj, searchObject);
      } else if (
        searchTerm.trim().length === 17 &&
        searchObject?.toLowerCase() === 'family id' &&
        searchTerm !== null &&
        searchTerm !== undefined
      ) {
        reqObj = {
          beneficiaryRegID: null,
          beneficiaryID: null,
          phoneNo: null,
          HealthID: null,
          HealthIDNumber: null,
          familyId: searchTerm,
          identity: null,
        };
        this.getSearchResult(reqObj, searchObject);
      } else if (
        (searchTerm.trim().length === 14 || searchTerm.trim().length === 17) &&
        (searchObject?.toLowerCase() === 'health id' ||
          searchObject?.toLowerCase() === 'healthid number') &&
        searchTerm !== null &&
        searchTerm !== undefined
      ) {
        this.checkValidHealthIDNumber(searchTerm, searchObject);
        reqObj = {
          beneficiaryRegID: null,
          beneficiaryID: null,
          phoneNo: null,
          HealthID: searchTerm,
          HealthIDNumber: null,
          familyId: null,
          identity: null,
        };
        this.getSearchResult(reqObj, searchObject);
      } else if (
        (searchTerm.trim().length === 12 || searchTerm.trim().length === 10) &&
        searchObject?.toLowerCase() === 'govid' &&
        searchTerm !== null &&
        searchTerm !== undefined
      ) {
        reqObj = {
          beneficiaryRegID: null,
          beneficiaryID: null,
          phoneNo: null,
          HealthID: null,
          HealthIDNumber: null,
          familyId: null,
          identity: searchTerm,
        };
        this.getSearchResult(reqObj, searchObject);
      } else {
        // this.confirmationService.alert(
        //   this.currentLanguageSet.pleaseEnterValidInputFor + searchObject,
        //   'info',
        // );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.pleaseEnterValidInput,
        'info',
      );
    }
  }

  getSearchResult(reqObj: any, searchObject: any) {
    this.registrarService.identityQuickSearch(reqObj).subscribe(
      (beneficiaryList: any) => {
        if (!beneficiaryList || beneficiaryList.data.length <= 0) {
          this.beneficiaryList.data = [];
          this.filteredBeneficiaryList = [];
          this.dataSource.data = [];
          this.pagedList = [];
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.beneNotFound,
            'info',
          );
        } else {
          this.beneficiaryList = this.searchRestruct(
            beneficiaryList,
            searchObject,
          );
          this.filteredBeneficiaryList = this.beneficiaryList;
          this.dataSource.data = this.beneficiaryList;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
            this.paginator.pageSize = 5;
            this.paginator.firstPage();
          }

          this.changeDetectorRef.detectChanges();
        }
        console.log(
          'beneficiaryList********* in line 182',
          this.beneficiaryList,
        );
      },
      (error: any) => {
        this.confirmationService.alert(error, 'error');
      },
    );
  }

  checkValidHealthIDNumber(searchTerm: any, searchObject: any) {
    const healthidval =
      searchTerm !== undefined && searchTerm !== null
        ? searchTerm.trim()
        : searchTerm;
    if (
      searchTerm !== undefined &&
      searchTerm !== null &&
      searchTerm.trim().length === 14
    ) {
      const healthIDNumberPatternWithoutHypen = /\d{14}$/;
      return this.validateHealthIDNumberPattern(
        healthIDNumberPatternWithoutHypen,
        healthidval,
        searchObject,
      );
    } else if (healthidval.length === 17) {
      const healthIDNumberPatternWithHypen =
        /^(\d{2})-(\d{4})-(\d{4})-(\d{4})*$/;
      return this.validateHealthIDNumberPattern(
        healthIDNumberPatternWithHypen,
        healthidval,
        searchObject,
      );
    } else {
      return this.validateHealthIDPattern(searchTerm, searchObject);
    }
  }

  validateHealthIDNumberPattern(
    pattern: any,
    healthidval: any,
    searchObject: any,
  ) {
    const checkPattern = pattern.test(healthidval);
    if (checkPattern) {
      searchObject =
        healthidval.length === 14
          ? healthidval.substring(0, 2) +
            '-' +
            healthidval.substring(2, 6) +
            '-' +
            healthidval.substring(6, 10) +
            '-' +
            healthidval.substring(10, healthidval.length)
          : healthidval;
      return true;
    } else {
      return this.validateHealthIDPattern(healthidval, searchObject);
    }
  }

  validateHealthIDPattern(healthidval: any, searchObject: any) {
    let healthIDPattern;
    if (environment.abhaExtension === '@abdm') {
      healthIDPattern = /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{4})$/;
    } else {
      healthIDPattern = /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{3})$/;
    }

    const checkPattern = healthIDPattern.test(healthidval);
    if (checkPattern) {
      searchObject['HealthID'] = healthidval;
      return true;
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.pleaseEnterValidInput,
        'info',
      );
      return false;
    }
  }

  /**
   * ReStruct the response object of Identity Search to be as per search table requirements
   */
  searchRestruct(benList: any, benObject: any) {
    const requiredBenData: any = [];
    benList.data.forEach((element: any, i: any) => {
      requiredBenData.push({
        beneficiaryID: element.beneficiaryID,
        beneficiaryRegID: element.beneficiaryRegID,
        benName: `${element.firstName} ${element.lastName || ''}`,
        genderName: `${element.genderName || 'Not Available'}`,
        fatherName: `${element.fatherName || 'Not Available'}`,
        districtName: `${
          element.i_bendemographics.districtName || 'Not Available'
        }`,
        villageName: `${
          element.i_bendemographics.districtBranchName || 'Not Available'
        }`,
        phoneNo: this.getCorrectPhoneNo(element.benPhoneMaps, benObject),
        age:
          moment(element.dOB).fromNow(true) === 'a few seconds'
            ? 'Not Available'
            : moment(element.dOB).fromNow(true),
        registeredOn: moment(element.createdDate).format('DD-MM-YYYY'),
        benObject: element,
      });
    });
    console.log(JSON.stringify(requiredBenData, null, 4), 'yoooo!');
   console.log("requiredBenData", JSON.stringify(requiredBenData));
    return requiredBenData;
  }

  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredBeneficiaryList.slice(startItem, endItem);
    console.log('list', this.pagedList);
  }

  getCorrectPhoneNo(phoneMaps: any[], benObject: any): string {
    if (!phoneMaps.length) {
      return 'Not Available';
    }

    if (benObject && benObject.phoneNo) {
      for (const elem of phoneMaps) {
        if (elem.phoneNo === benObject.phoneNo) {
          return elem.phoneNo;
        }
      }
    }

    return phoneMaps[0].phoneNo;
  }

  filterBeneficiaryList(searchTerm?: string) {
    if (!searchTerm) this.filteredBeneficiaryList = this.beneficiaryList;
    else {
      this.filteredBeneficiaryList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.beneficiaryList.forEach((item: any) => {
        for (const key in item) {
          if (key !== 'benObject') {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              (this.filteredBeneficiaryList as any[]).push(item);
              this.dataSource.data.push(item);
              this.dataSource.paginator = this.paginator;
              this.dataSource.data.forEach(
                (sectionCount: any, index: number) => {
                  sectionCount.sno = index + 1;
                }
              );
              break;
            }
          }
        }
      });
    }
  }

  patientRevisited(benObject: any) {
    if (
      benObject &&
      benObject.m_gender &&
      benObject.genderName &&
      benObject.dOB
    ) {
      const action = false;
      console.log(JSON.stringify(benObject, null, 4), 'benObject');
      const vanID = JSON.parse(
        localStorage.getItem('serviceLineDetails') ?? '{}'
      )?.vanID;
      benObject['providerServiceMapId'] =
        localStorage.getItem('providerServiceID');
      benObject['vanID'] = vanID;

      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.confirmSubmitBeneficiary
        )
        .subscribe(result => {
          if (result) this.sendToNurseWindow(result, benObject);
        });
    } else if (!benObject.m_gender.genderName && !benObject.dOB) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.genderAndAgeDetails,
        'info'
      );
    } else if (!benObject.m_gender.genderName) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.noGenderDetails,
        'info'
      );
    } else if (!benObject.dOB) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.noAgeDetailsAvail,
        'info'
      );
    }
  }

  editPatientInfo(beneficiary: any) {
    this.confirmationService
      .confirm(`info`, this.currentLanguageSet.alerts.info.editDetails)
      .subscribe(result => {
        if (result) {
          this.registrarService.saveBeneficiaryEditDataASobservable(
            beneficiary.benObject
          );
          console.log('beneficiaryyy details', beneficiary)
          this.router.navigate([
            '/registrar/search/' + beneficiary.beneficiaryID,
          ]);
        }
      });
  }

  sendToNurseWindow(userResponse: boolean, benObject: any) {
    if (userResponse) {
      this.registrarService.identityPatientRevisit(benObject).subscribe(
        (result: any) => {
          if (result.data)
            this.confirmationService.alert(result.data.response, 'success');
          else this.confirmationService.alert(result.status, 'warn');
        },
        error => {
          this.confirmationService.alert(error, 'error');
        }
      );
    }
  }

  patientImageView(benregID: any) {
    if (
      benregID &&
      benregID !== null &&
      benregID !== '' &&
      benregID !== undefined
    ) {
      this.beneficiaryDetailsService
        .getBeneficiaryImage(benregID)
        .subscribe((data: any) => {
          if (data && data.benImage)
            this.cameraService.viewImage(data.benImage);
          else
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.imageNotFound
            );
        });
    }
  }

  openSearchDialog() {
    const mdDialogRef: MatDialogRef<SearchDialogComponent> = this.dialog.open(
      SearchDialogComponent,
      {
        width: '60%',
        disableClose: false,
      }
    );

    mdDialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('something fishy happening here', result);
        this.advanceSearchTerm = result;
        this.registrarService
          .advanceSearchIdentity(this.advanceSearchTerm)
          .subscribe(
            (beneficiaryList: any) => {
              if (
                !beneficiaryList ||
                (beneficiaryList.data && beneficiaryList.data.length <= 0)
              ) {
                this.beneficiaryList = [];
                this.filteredBeneficiaryList = [];
                this.dataSource.data = [];
                console.log("this.dataSource.data3", this.dataSource.data);
                this.dataSource.paginator = this.paginator;
                this.quicksearchTerm = null;
                this.confirmationService.alert(
                  this.currentLanguageSet.alerts.info.beneficiarynotfound,
                  'info'
                );
              } else {
                this.beneficiaryList = this.searchRestruct(beneficiaryList, {});
                this.filteredBeneficiaryList = this.beneficiaryList;
                this.dataSource.data = this.beneficiaryList;
                console.log("this.dataSource.data4", this.dataSource.data);
                this.dataSource.paginator = this.paginator;
                this.dataSource.data.forEach(
                  (sectionCount: any, index: number) => {
                    sectionCount.sno = index + 1;
                  }
                );
              }
              console.log(JSON.stringify(beneficiaryList, null, 4));
            },
            error => {
              this.confirmationService.alert(error, 'error');
            }
          );
      }
    });
  }
  navigateTORegistrar() {
    const link = '/registrar/registration';
    const currentRoute = this.router.routerState.snapshot.url;
    console.log('currentRoute', currentRoute);
    if (currentRoute !== link) {
      console.log('log in');
      if (this.beneficiaryList === undefined) {
        this.router.navigate([link]);
      } else if (this.beneficiaryList !== undefined) {
        if (this.beneficiaryList.length === 0) {
          this.router.navigate([link]);
        } else {
          this.confirmationService
            .confirm(
              `info`,
              `Do you really want to navigate? Any searched data would be lost`,
              'Yes',
              'No'
            )
            .subscribe(result => {
              if (result) {
                this.router.navigate([link]);
              }
            });
        }
      }
    }
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
