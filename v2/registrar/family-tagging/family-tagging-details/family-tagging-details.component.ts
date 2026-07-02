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
  DoCheck,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { CreateFamilyTaggingComponent } from '../create-family-tagging/create-family-tagging.component';
import { EditFamilyTaggingComponent } from '../edit-family-tagging/edit-family-tagging.component';
import { FamilyTaggingService } from '../../services/familytagging.service';
import { RegistrarService } from '../../services/registrar.service';
import { SearchFamilyComponent } from '../../search-family/search-family.component';
import { SessionStorageService } from '../../services/session-storage.service';
import { environment } from 'src/environments/environment';
import { BeneficiaryDetailsComponent } from '../../beneficiary-details/beneficiary-details.component';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUserRound,
  lucidePencil,
  lucidePlus,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardSheetComponent } from 'Common-UI/v2/ui/sheet';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-family-tagging-details',
  templateUrl: './family-tagging-details.component.html',
  imports: [
    NgIf,
    NgFor,
    TitleCasePipe,
    NgIcon,
    BeneficiaryDetailsComponent,
    ZardButtonComponent,
    ZardSheetComponent,
    ...cardImports,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...tooltipImports,
  ],
  viewProviders: [
    provideIcons({
      lucideUserRound,
      lucidePencil,
      lucidePlus,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
})
export class FamilyTaggingDetailsComponent
  implements OnInit, DoCheck, OnDestroy
{
  sidenavOpen = true;

  displayedColumns = [
    'familyId',
    'familyName',
    'headOfTheFamily',
    'benRelationWithHeadOfFamily',
  ];
  displayedColumns1 = [
    'sno',
    'familyId',
    'headOfTheFamily',
    'familyName',
    'members',
    'action',
  ];
  currentLanguageSet: any;
  reqObj!: {
    familyId: any;
    familyName: any;
    isHeadOfFamily: any;
    relationWithHeadOfFamily: any;
    otherRelation: any;
  };
  blankTable = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  familytaggingservice: any;
  revisitDataSubscription: any;
  revisitData: any;
  params: any;
  disableCreateFamily = false;
  externalSearchTerm: any;
  benFamilyId: any = null;
  benFamilyName: any = null;
  headOfTheFamily = null;
  familySearchList: any[] = [];
  createdFamilyList: any[] = [];
  beneficiaryRegID: any;
  beneficiaryName: any;
  enableFamilyCreateTable = true;
  beneficiaryRelationWithHeadOfFamily: any;
  benVillageId: any;
  beneficiaryId: any;
  searchRequest: any = null;
  beneficiary: any;
  benStateId: any;
  benDistrictId: any;
  benBlockId: any;
  isEnableES: boolean = false;

  constructor(
    private dialog: ZardDialogService,
    private viewContainerRef: ViewContainerRef,
    public httpServiceService: HttpServiceService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private familyTaggingService: FamilyTaggingService,
    private registrarService: RegistrarService,
    private route: ActivatedRoute,
    private sessionstorage:SessionStorageService,
  ) {}

  ngOnInit() {

    this.isEnableES = environment.isEnableES || false;
    this.assignSelectedLanguage();
    this.benFamilyId = this.route.snapshot.paramMap.get('familyId');
    this.benFamilyName = this.route.snapshot.paramMap.get('familyName');
    this.beneficiaryRegID =
      this.route.snapshot.paramMap.get('beneficiaryRegID');
    this.beneficiaryName = this.route.snapshot.paramMap.get('beneficiaryName');
    this.benStateId = this.route.snapshot.paramMap.get('benStateId');
    this.benDistrictId = this.route.snapshot.paramMap.get('benDistrictId');
    this.benBlockId = this.route.snapshot.paramMap.get('benBlockId');
    this.benVillageId = this.route.snapshot.paramMap.get('benVillageId');
    this.beneficiaryId = this.route.snapshot.paramMap.get('beneficiaryId');
    this.sessionstorage.setItem('beneficiaryID', this.beneficiaryId);
    this.sessionstorage.setItem('beneficiaryRegID', this.beneficiaryRegID);
    const familySearchListValues = this.route.snapshot.paramMap.get(
      'familySearchListDetails',
    );
    if (
      familySearchListValues !== undefined &&
      familySearchListValues !== null &&
      familySearchListValues !== 'undefined' &&
      familySearchListValues !== 'null'
    ) {
      const familySearchListObj = JSON.parse(familySearchListValues);
      this.familySearchList = familySearchListObj.familyDetails;
      this.searchRequest = familySearchListObj.searchRequest;
      this.enableFamilyCreateTable = false;
      this.createdFamilyList = [];
    } else {
      this.familySearchList = [];
      this.enableFamilyCreateTable = true;
      this.createdFamilyList = [];
    }

    this.benFamilyId =
      this.benFamilyId !== undefined &&
      this.benFamilyId !== null &&
      this.benFamilyId !== 'undefined' &&
      this.benFamilyId !== 'null'
        ? this.benFamilyId
        : null;
    this.benFamilyName =
      this.benFamilyName !== undefined &&
      this.benFamilyName !== null &&
      this.benFamilyName !== 'undefined' &&
      this.benFamilyName !== 'null'
        ? this.benFamilyName
        : null;
    this.beneficiaryRegID =
      this.beneficiaryRegID !== undefined &&
      this.beneficiaryRegID !== null &&
      this.beneficiaryRegID !== 'undefined' &&
      this.beneficiaryRegID !== 'null'
        ? this.beneficiaryRegID
        : null;
    this.beneficiaryName =
      this.beneficiaryName !== undefined &&
      this.beneficiaryName !== null &&
      this.beneficiaryName !== 'undefined' &&
      this.beneficiaryName !== 'null'
        ? this.beneficiaryName
        : null;
    this.benDistrictId =
      this.benDistrictId !== undefined &&
      this.benDistrictId !== null &&
      this.benDistrictId !== 'undefined' &&
      this.benDistrictId !== 'null'
        ? this.benDistrictId
        : null;
    this.benBlockId =
      this.benBlockId !== undefined &&
      this.benBlockId !== null &&
      this.benBlockId !== 'undefined' &&
      this.benBlockId !== 'null'
        ? this.benBlockId
        : null;
    this.benVillageId =
      this.benVillageId !== undefined &&
      this.benVillageId !== null &&
      this.benVillageId !== 'undefined' &&
      this.benVillageId !== 'null'
        ? this.benVillageId
        : null;
    this.beneficiaryId =
      this.beneficiaryId !== undefined &&
      this.beneficiaryId !== null &&
      this.beneficiaryId !== 'undefined' &&
      this.beneficiaryId !== 'null'
        ? this.beneficiaryId
        : null;

    if (this.benFamilyId !== undefined && this.benFamilyId !== null) {
      const reqObj = {
        beneficiaryRegID: this.beneficiaryRegID,
        familyName: this.benFamilyName,
        familyId: this.benFamilyId,
        districtId: this.benDistrictId,
        blockId: this.benBlockId,
        villageId: this.benVillageId,
        beneficiaryId: this.beneficiaryId,
      };
      this.loadSearchDetails(reqObj);
      this.enableFamilyCreateTable = false;
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnDestroy() {
    this.registrarService.stateIdFamily = null;
    this.sessionstorage.removeItem('beneficiaryRegID');
    this.sessionstorage.removeItem('beneficiaryID');
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  CreateFamilyDialog() {
    const matDialogRef = this.dialog.create<
      CreateFamilyTaggingComponent,
      unknown
    >({
      zContent: CreateFamilyTaggingComponent,
      zData: {
        benFamilyName: this.benFamilyName,
        benFamilyID: this.benFamilyId,
        benRegId: this.beneficiaryRegID,
        beneficiaryName: this.beneficiaryName,
        benVillageId: this.benVillageId,
      },
      zWidth: '60%',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
    matDialogRef.afterClosed().subscribe(
      (result) => {
        if (result) {
          this.createdFamilyList = [];
          this.createdFamilyList.push(result);
          this.enableFamilyCreateTable = true;
          this.familySearchList = [];
          this.getBeneficiaryDetailsAfterFamilyTag();
        }
      },
      (error) => {
        this.confirmationService.alert(error, 'error');
      },
    );
  }

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
  }

  // ---- Client-side pagination for the family search list ----
  pageSize = 5;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.familySearchList.length / this.pageSize));
  }

  get pagedSearchList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.familySearchList.slice(start, start + this.pageSize);
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

  openSearchFamily() {
    const matDialogRef = this.dialog.create<SearchFamilyComponent, unknown>({
      zContent: SearchFamilyComponent,
      zData: {
        benSurname: this.benFamilyName,
        benStateId: this.benStateId,
        benDistrictId: this.benDistrictId,
        benBlockId: this.benBlockId,
        benVillageId: this.benVillageId,
      },
      zWidth: '60%',
      zMaskClosable: false,
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
    matDialogRef.afterClosed().subscribe((result: any) => {
      if (result !== null && result !== undefined) {
        this.familySearchList = result.familyDetails;
        this.searchRequest = result.searchRequest;
        this.enableFamilyCreateTable = false;
        this.createdFamilyList = [];
        this.currentPage = 1;

        this.getBeneficiaryDetailsAfterFamilyTag();
      }
    });
  }

  loadSearchDetails(requestObj: any) {
    this.familyTaggingService
      .benFamilySearch(requestObj)
      .subscribe((res: any) => {
        if (
          res &&
          res.statusCode === 200 &&
          res.data &&
          res.data.response === undefined
        ) {
          this.familySearchList = res.data;
        } else {
          this.familySearchList = [];
        }
        this.currentPage = 1;
        (err: string) => {
          this.confirmationService.alert(err, 'error');
        };
      });
  }

  PatientRevistData() {
    this.revisitDataSubscription =
      this.registrarService.beneficiaryEditDetails.subscribe((res: any) => {
        if (res !== null) {
          this.revisitData = Object.assign({}, res);
        }
      });
  }

  backToRegistration() {
    this.router.navigate(['/registrar/registration']);
  }

  getFamilyMembers(isEdit: any, familyDetails: any) {
    const memberReqObj = {
      familyId: familyDetails.familyId,
    };

    this.familyTaggingService.getFamilyMemberDetails(memberReqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data) {
          const familyMembersList = res.data;
          this.openFamilyTagDialog(isEdit, familyDetails, familyMembersList);
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err: string) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  openFamilyTagDialog(isEdit: any, familyDetails: any, familyMembersList: any) {
    const matDialogRef = this.dialog.create<EditFamilyTaggingComponent, unknown>(
      {
        zContent: EditFamilyTaggingComponent,
        zData: {
          isEdit: isEdit,
          familyData: familyMembersList,
          beneficiaryRegID: this.beneficiaryRegID,
          memberFamilyId: familyDetails.familyId,
          headInFamily: familyDetails.familyHeadName,
          beneficiaryName: this.beneficiaryName,
        },
        zWidth: '70%',
        zMaskClosable: false,
        zHideFooter: true,
        zClosable: false,
        zViewContainerRef: this.viewContainerRef,
      },
    );

    matDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSearchDetails(this.searchRequest);
        this.getBeneficiaryDetailsAfterFamilyTag();
      }
    });
  }

 getBeneficiaryDetailsAfterFamilyTag() {
  const benReqObj = {
    beneficiaryRegID: null,
    beneficiaryID: this.beneficiaryId,
    phoneNo: null,
    HealthID: null,
    HealthIDNumber: null,
    familyId: null,
    identity: null,
  };

  if (this.isEnableES) {
    // Use Elasticsearch when enabled
    const esSearchReqObj = {
      search: this.beneficiaryId
    };
    
    this.registrarService.identityQuickSearchES(esSearchReqObj).subscribe(
      (beneficiaryDetails: any) => {
        if (beneficiaryDetails && beneficiaryDetails.statusCode === 200 && 
            beneficiaryDetails.data && beneficiaryDetails.data.length === 1) {
          this.benFamilyId =
            beneficiaryDetails.data[0].familyID !== undefined &&
            beneficiaryDetails.data[0].familyID !== null
              ? beneficiaryDetails.data[0].familyID
              : null;
          this.registrarService.getBenFamilyDetails(this.benFamilyId);
        } else {
          this.benFamilyId = null;
        }
      },
      (error: string) => {
        this.confirmationService.alert(error, 'error');
      }
    );
  } else {
    // Use regular search when Elasticsearch is disabled
    this.registrarService.identityQuickSearch(benReqObj).subscribe(
      (beneficiaryDetails: any) => {
        if (beneficiaryDetails && beneficiaryDetails.data.length === 1) {
          this.benFamilyId =
            beneficiaryDetails.data[0].familyId !== undefined &&
            beneficiaryDetails.data[0].familyId !== null
              ? beneficiaryDetails.data[0].familyId
              : null;
          this.registrarService.getBenFamilyDetails(this.benFamilyId);
        } else {
          this.benFamilyId = null;
        }
      },
      (error: string) => {
        this.confirmationService.alert(error, 'error');
      }
    );
  }
}
}
