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
  DoCheck,
  AfterViewChecked,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import {
  ConfirmationService,
  CameraService,
  BeneficiaryDetailsService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from 'Common-UI/v2/registrar/services/registrar.service';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from '../services/session-storage.service';
import { HealthIdDisplayModalComponent } from '../abha-components/health-id-display-modal/health-id-display-modal.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucidePencil,
  lucideUserPlus,
  lucideSlidersHorizontal,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

export interface Consent {
  consentGranted: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    NgFor,
    TitleCasePipe,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...cardImports,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
    ...tooltipImports,
  ],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucidePencil,
      lucideUserPlus,
      lucideSlidersHorizontal,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
})
export class SearchComponent implements OnInit, DoCheck, AfterViewChecked, OnDestroy {
  rotate = true;
  beneficiaryList: any;
  filteredBeneficiaryList: any[] = [];
  quicksearchTerm: any;
  advanceSearchTerm: any;
  filterTerm = '';
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;
  searchPattern!: string;
  consentGranted: any;
  isEnableES: boolean = false;
  searchCategory: any;

  // Client-side pagination state (replaces MatPaginator / MatTableDataSource)
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  // Add these for debounced search
  private searchSubject$ = new Subject<string>();
  private searchSubscription: any;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private registrarService: RegistrarService,
    private cameraService: CameraService,
    private router: Router,
    private sessionstorage: SessionStorageService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.isEnableES = environment.isEnableES || false;

    this.searchPattern = this.isEnableES ? '/^[a-zA-Z0-9]*$/;' : '/^[a-zA-Z0-9](.|@|-)*$/;';
    if (this.isEnableES) {
      this.setupDebouncedSearch();
    }
  }

  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // Setup debounced search for typing
  setupDebouncedSearch() {
    this.searchSubscription = this.searchSubject$
      .pipe(
        debounceTime(500), // 500ms delay after typing stops
        distinctUntilChanged(), // Only emit if value changed
        switchMap((searchTerm: string) => {
          // Validate alphanumeric
          const alphanumericPattern = /^[a-zA-Z0-9\s]*$/;
          if (!alphanumericPattern.test(searchTerm)) {
            this.confirmationService.alert(
              'Please enter valid alphanumeric input',
              'info'
            );
            return [];
          }
          return this.registrarService.identityQuickSearchES({ search: searchTerm });
        })
      )
      .subscribe(
        (response: any) => {
          this.handleESSearchResponse(response);
        },
        (error: any) => {
          this.confirmationService.alert(error, 'error');
        }
      );
  }

  // Method to handle input changes with debounce (for typing)
  onSearchInputChange(searchTerm: string) {
    const trimmed = searchTerm?.trim() || '';
    if (trimmed.length >= 3) {
      this.searchSubject$.next(trimmed);
    } else if (trimmed.length === 0) {
      this.resetWorklist();
    }
  }

  onSearchButtonClick(searchTerm: any) {
    if (this.isEnableES) {
      if (!searchTerm || searchTerm.trim().length < 3) {
        this.confirmationService.alert(
          'Please enter at least 3 characters',
          'info'
        );
        this.resetWorklist();
        return;
      }

      const trimmed = searchTerm.trim();
      const alphanumericPattern = /^[a-zA-Z0-9\s]*$/;
      if (!alphanumericPattern.test(trimmed)) {
        this.confirmationService.alert(
          'Please enter valid alphanumeric input',
          'info'
        );
        return;
      }

      this.registrarService.identityQuickSearchES({ search: trimmed })
        .subscribe(
          (response: any) => {
            this.handleESSearchResponse(response);
          },
          (error: any) => {
            this.confirmationService.alert(error, 'error');
          }
        );
    } else {
      this.identityQuickSearch(searchTerm);
    }
  }


  // Common method to handle ES API response
  handleESSearchResponse(response: any) {
    if (!response?.data || response.data.length === 0) {
      this.resetWorklist();
      this.confirmationService.alert(
        this.currentLanguageSet?.alerts?.info?.beneficiarynotfound || 'Beneficiary not found',
        'info'
      );
    } else {
      this.setResults(this.searchRestructES(response.data));
      this.changeDetectorRef.detectChanges();
    }
  }

  // Restructure ES API response
  searchRestructES(benList: any[]) {
    const requiredBenData: any[] = [];
    benList.forEach((element: any) => {
      requiredBenData.push({
        beneficiaryID: element.beneficiaryID,
        beneficiaryRegID: element.beneficiaryRegID,
        benName: `${element.firstName} ${element.lastName || ''}`,
        genderName: element.m_gender?.genderName || element.genderName || 'Not Available',
        fatherName: element.fatherName || 'Not Available',
        districtName: element.i_bendemographics?.m_district?.districtName || 
                      element.i_bendemographics?.districtName || 'Not Available',
        villageName: element.i_bendemographics?.m_districtbranchmapping?.villageName || 
                    element.i_bendemographics?.villageName || 
                    element.i_bendemographics?.districtBranchName || 'Not Available',
        phoneNo: element.benPhoneMaps?.[0]?.phoneNo || 'Not Available',
        age: moment(element.dob || element.dOB).fromNow(true) === 'a few seconds'
          ? 'Not Available'
          : moment(element.dob || element.dOB).fromNow(true),
        registeredOn: moment(element.createdDate).format('DD-MM-YYYY'),
        benObject: element,
      });
    });
    console.log('Restructured ES data:', requiredBenData);
    return requiredBenData;
  }

  // Reset worklist
  resetWorklist() {
    this.beneficiaryList = [];
    this.filteredBeneficiaryList = [];
    this.currentPage = 1;
  }

  /** Set the result list and reset filter + pagination to the first page. */
  setResults(list: any[]) {
    this.beneficiaryList = list;
    this.filteredBeneficiaryList = list;
    this.filterTerm = '';
    this.currentPage = 1;
  }

  // ---- Client-side pagination (replaces MatPaginator) ----
  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredBeneficiaryList.length / this.pageSize),
    );
  }

  get pagedList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBeneficiaryList.slice(start, start + this.pageSize);
  }

  /** A small window of page numbers around the current page (max 5). */
  get pageNumbers(): number[] {
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  changePageSize(size: string | string[]) {
    const value = Array.isArray(size) ? size[0] : size;
    this.pageSize = Number(value);
    this.currentPage = 1;
  }

  identityQuickSearch(searchTerm: any) {
   
    const searchObject = {
      beneficiaryRegID: null,
      beneficiaryID: null,
      phoneNo: null,
      HealthID: null,
      HealthIDNumber: null,
      familyId: null,
      identity: null,
    };
    if (
      searchTerm === undefined ||
      searchTerm.trim() === '' ||
      searchTerm.trim().length <= 0
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.pleaseenterBeneficiaryID,
        'info',
      );
    } else {
      if (
        searchTerm.trim().length === 10 ||
        searchTerm.trim().length === 12 ||
        searchTerm.trim().length === 14 ||
        searchTerm.trim().length === 17
      ) {
        if (searchTerm.trim().length === 10) {
          searchObject['phoneNo'] = searchTerm;
        } else if (searchTerm.trim().length === 12) {
          searchObject['beneficiaryID'] = searchTerm;
        } else if (
          searchTerm.trim().length === 14 ||
          searchTerm.trim().length === 17
        ) {
          searchObject['HealthID'] = searchTerm;
          searchObject['HealthIDNumber'] = searchTerm;
        }
        this.registrarService.identityQuickSearch(searchObject).subscribe(
          (beneficiaryList: any) => {
            if (!beneficiaryList || beneficiaryList.length <= 0) {
              this.resetWorklist();
              this.confirmationService.alert(
                this.currentLanguageSet.alerts.info.beneficiarynotfound,
                'info',
              );
            } else {
              this.setResults(
                this.searchRestruct(beneficiaryList, searchObject),
              );
            }
            console.log('hi', JSON.stringify(beneficiaryList, null, 4));
          },
          (error) => {
            this.confirmationService.alert(error, 'error');
          },
        );
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.phoneDetails,
          'info',
        );
      }
    }
  }

  getHealthIDDetails(data: any) {
    console.log('data', data);
    if (
      data.benObject != undefined &&
      data.benObject.abhaDetails != undefined &&
      data.benObject.abhaDetails != null &&
      data.benObject.abhaDetails.length > 0
    ) 
    {
      this.dialog.open(HealthIdDisplayModalComponent, {
        data: { dataList: data.benObject.abhaDetails[0], search: true },
      });
    } else
      this.confirmationService.alert(
        this.currentLanguageSet.abhaDetailsNotAvailable,
        'info',
      );
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
    console.log('requiredBenData', JSON.stringify(requiredBenData));
    return requiredBenData;
  }

  getCorrectPhoneNo(phoneMaps: any[], benObject: any): string {
    if (!phoneMaps || !phoneMaps.length) {
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
    this.filterTerm = searchTerm ?? '';
    const term = (searchTerm || '').toLowerCase().trim();
    if (term) {
      this.filteredBeneficiaryList = (this.beneficiaryList ?? []).filter(
        (item: any) => {
          for (const key in item) {
            if (key !== 'benObject') {
              const value: string = '' + item[key];
              if (value.toLowerCase().includes(term)) {
                return true;
              }
            }
          }
          return false;
        },
      );
    } else {
      this.filteredBeneficiaryList = this.beneficiaryList ?? [];
    }
    this.currentPage = 1;
  }

  patientRevisited(benObject: any) {
    if (
      benObject &&
      benObject.m_gender &&
      benObject.m_gender.genderName &&
      benObject.dob
    ) {
      const action = false;
      console.log(JSON.stringify(benObject, null, 4), 'benObject');
      const serviceLineDetails: any =
        this.sessionstorage.getItem('serviceLineDetails');
      const vanID = JSON.parse(serviceLineDetails).vanID;
      benObject['providerServiceMapId'] =
        this.sessionstorage.getItem('providerServiceID');
      benObject['vanID'] = vanID;

      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.confirmSubmitBeneficiary,
        )
        .subscribe((result) => {
          if (result) this.sendToNurseWindow(result, benObject);
        });
    } else if (!benObject.m_gender.genderName && !benObject.dob) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.genderAndAgeDetails,
        'info',
      );
    } else if (!benObject.m_gender.genderName) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.noGenderDetails,
        'info',
      );
    } else if (!benObject.dob) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.noAgeDetailsAvail,
        'info',
      );
    }
  }

  editPatientInfo(beneficiary: any) {
    this.confirmationService
      .confirm(`info`, this.currentLanguageSet.alerts.info.editDetails)
      .subscribe((result) => {
        if (result) {
          this.registrarService.saveBeneficiaryEditDataASobservable(
            beneficiary.benObject,
          );
          console.log('beneficiaryyy details', beneficiary);
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
        (error) => {
          this.confirmationService.alert(error, 'error');
        },
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
              this.currentLanguageSet.alerts.info.imageNotFound,
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
    },
  );

  mdDialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.advanceSearchTerm = result;
      
      // Use ES-based advanced search if Elasticsearch is enabled
      if (this.isEnableES) {
        this.registrarService
          .advanceSearchIdentityES(this.advanceSearchTerm)
          .subscribe(
            (response: any) => {
              if (!response?.data || response.data.length === 0) {
                this.resetWorklist();
                this.quicksearchTerm = null;
                this.confirmationService.alert(
                  this.currentLanguageSet.alerts.info.beneficiaryNotFound,
                  'info',
                );
              } else {
                this.setResults(this.searchRestructES(response.data));
                this.changeDetectorRef.detectChanges();
              }
              console.log('ES Advanced Search Result:', JSON.stringify(response, null, 4));
            },
            (error) => {
              this.confirmationService.alert(error, 'error');
            },
          );
      } else {
        // Use regular advanced search for non-ES mode
        this.registrarService
          .advanceSearchIdentity(this.advanceSearchTerm)
          .subscribe(
            (beneficiaryList: any) => {
              if (
                !beneficiaryList ||
                (beneficiaryList.data && beneficiaryList.data.length <= 0)
              ) {
                this.resetWorklist();
                this.quicksearchTerm = null;
                this.confirmationService.alert(
                  this.currentLanguageSet.alerts.info.beneficiaryNotFound,
                  'info',
                );
              } else {
                this.setResults(this.searchRestruct(beneficiaryList, {}));
              }
              console.log(JSON.stringify(beneficiaryList, null, 4));
            },
            (error) => {
              this.confirmationService.alert(error, 'error');
            },
          );
      }
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
              'No',
            )
            .subscribe((result) => {
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