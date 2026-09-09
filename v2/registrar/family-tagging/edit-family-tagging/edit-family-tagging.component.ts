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
import { Component, DoCheck, Inject, OnInit, ViewChild } from '@angular/core';
import { ZardDialogRef, Z_MODAL_DATA } from 'Common-UI/v2/ui/dialog';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { FamilyTaggingService } from '../../services/familytagging.service';
import { SessionStorageService } from '../../services/session-storage.service';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardCheckboxComponent } from 'Common-UI/v2/ui/checkbox';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { ZardTableImports } from 'Common-UI/v2/ui/table';

@Component({
  selector: 'app-edit-family-tagging',
  templateUrl: './edit-family-tagging.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    TitleCasePipe,
    ReactiveFormsModule,
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ...ZardFormImports,
    ZardInputDirective,
    ...ZardSelectImports,
    ...ZardTableImports,
  ],
  viewProviders: [provideIcons({ lucideX })],
})
export class EditFamilyTaggingComponent implements OnInit, DoCheck {
  @ViewChild('editFamilyTaggingForm')
  form: any;

  currentLanguageSet: any;
  familyHead: any;
  relationWithHead: any;
  other: any;

  selectedMembersList: any[] = [];
  displayedColumns1 = [
    'sno',
    'memberId',
    'memberName',
    'familyName',
    'members',
    'action',
  ];

  disableForm = false;
  uncheckMember = false;
  familyDetails: any;
  showCheckbox = true;
  enableOther = false;
  relationShipList: any[] = [];
  disableUntag = true;
  memberFamilyId: any;
  headInFamily: any;
  countryID = 1;
  beneficiaryName: any;

  constructor(
    public httpServiceService: HttpServiceService,
    public matDialogRef: ZardDialogRef<EditFamilyTaggingComponent>,
    @Inject(Z_MODAL_DATA) public data: any,
    private confirmationService: ConfirmationService,
    private familyTaggingService: FamilyTaggingService,
    private sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getRelationShipMaster();
    this.familyDetails = this.data.familyData;
    this.memberFamilyId = this.data.memberFamilyId;
    this.headInFamily = this.data.headInFamily;
    this.beneficiaryName = this.data.beneficiaryName;
    this.showCheckbox = this.data.isEdit;
    if (this.showCheckbox) {
      this.disableForm = true;
    } else {
      this.disableForm = false;
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  resetEditFamilyTaggingorm() {
    this.form.reset();
    this.selectedMembersList.filter((item) => {
      item.selected = false;
    });
    this.selectedMembersList = [];
    this.uncheckMember = false;
    this.relationShipList = [];
    this.disableUntag = true;
    this.enableOther = false;
    if (this.showCheckbox) {
      this.disableForm = true;
    } else {
      this.disableForm = false;
    }
  }

  selectMember(checked: boolean, item: any) {
    this.uncheckMember = true;
    if (checked) {
      item.selected = true;
      this.selectedMembersList.push(item);
    } else {
      const index = this.selectedMembersList.indexOf(item);
      this.selectedMembersList.splice(index, 1);
      item.selected = false;
    }
    this.form.reset();
    this.relationShipList = [];
    this.enableOther = false;
    if (this.selectedMembersList.length !== 1) {
      this.disableForm = true;
    } else this.disableForm = false;

    if (this.selectedMembersList.length >= 1) {
      this.disableUntag = false;
    } else {
      this.disableUntag = true;
    }
  }

  relationShipType: any[] = [];
  getRelationShipMaster() {
    this.familyTaggingService
      .getRelationShips(this.countryID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.relationShipType = res.data.relationshipMaster;
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.issueFetchingRelationship,
            'error',
          );
        }
      });
  }

  populateRelation(isHead: any) {
    this.disableUntag = true;
    this.relationShipList = [];
    this.other = null;
    this.enableOther = false;
    if (isHead.toLowerCase() === 'yes') {
      const relation = this.relationShipType.filter((item) => {
        if (item.benRelationshipType.toLowerCase() === 'self') {
          this.relationShipList.push(item);
          return item.benRelationshipID;
        }
      });
      this.relationWithHead = relation[0].benRelationshipID;
    } else {
      this.relationShipType.filter((item) => {
        if (item.benRelationshipType.toLowerCase() !== 'self') {
          this.relationShipList.push(item);
        }
      });

      this.relationWithHead = null;
    }
  }

  checkOtherRelation(relationValue: any) {
    // z-select emits a string; coerce to number to match the numeric
    // benRelationshipID used throughout the relationship logic.
    this.relationWithHead =
      relationValue === null || relationValue === undefined
        ? relationValue
        : Number(relationValue);
    const coercedValue = this.relationWithHead;
    this.other = null;
    const relationTypeValue = this.relationShipType.filter((item) => {
      if (item.benRelationshipType.toLowerCase() === 'other') {
        return item;
      }
    });

    if (
      relationTypeValue !== undefined &&
      relationTypeValue !== null &&
      relationTypeValue.length > 0 &&
      relationTypeValue[0].benRelationshipID !== undefined &&
      relationTypeValue[0].benRelationshipID !== null &&
      relationTypeValue[0].benRelationshipID === coercedValue
    ) {
      this.enableOther = true;
    } else {
      this.enableOther = false;
    }
  }

  saveFamilyTagging() {
    const typeOfRelation = this.relationShipType.filter((item) => {
      if (item.benRelationshipID === this.relationWithHead) return item;
    });
    const familymembers: any[] = [];
    let headName: any = null;
    this.familyDetails.familyMembers.forEach((family: any) => {
      if (family.relationWithHead) familymembers.push(family.relationWithHead);
      if (family.relationWithHead.toLowerCase() === 'self')
        headName = family.memberName;
    });
    if (
      familymembers.includes('Self') &&
      typeOfRelation[0].benRelationshipType.toLowerCase() === 'self' &&
      this.selectedMembersList.length > 0 &&
      headName?.trim().toLowerCase() !==
        this.selectedMembersList[0].memberName.trim().toLowerCase()
    )
      this.confirmationService.alert(
        this.currentLanguageSet
          .HeadOfTheFamilyAlreadyPresentRemoveExistingAndContinue,
        'Info',
      );
    else if (
      familymembers.includes('Self') &&
      typeOfRelation[0].benRelationshipType.toLowerCase() === 'self' &&
      this.selectedMembersList.length === 0
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.HeadOfTheFamilyAlreadyPresentRemoveExisting,
        'Info',
      );
    } else {
      if (this.data.isEdit) {
        const serviceLineDetails: any =
          this.sessionstorage.getItem('serviceLineDetails');
        const vanID = JSON.parse(serviceLineDetails).vanID;
        const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

        const requestObjEdit = {
          familyId: this.memberFamilyId,
          beneficiaryRegId: this.selectedMembersList[0].memberId,
          isHeadOfTheFamily:
            typeOfRelation[0].benRelationshipType.toLowerCase() === 'self'
              ? true
              : false,
          memberName: this.selectedMembersList[0].memberName,
          headofFamily_RelationID: this.relationWithHead,
          headofFamily_Relation: typeOfRelation[0].benRelationshipType,
          other: this.other,
          vanID: vanID,
          parkingPlaceID: parkingPlaceID,
          modifiedBy: this.sessionstorage.getItem('userName'),
        };
        this.familyTaggingService.editFamilyTagging(requestObjEdit).subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data) {
              this.confirmationService.alert(res.data.response, 'success');
              this.matDialogRef.close(true);
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          (err: string) => {
            this.confirmationService.alert(err, 'error');
          },
        );
      } else {
        const serviceLineDetails: any =
          this.sessionstorage.getItem('serviceLineDetails');
        const vanID = JSON.parse(serviceLineDetails).vanID;
        const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
        const requestObj = {
          familyId: this.memberFamilyId,
          beneficiaryRegId: this.data.beneficiaryRegID,
          isHeadOfTheFamily:
            typeOfRelation[0].benRelationshipType.toLowerCase() === 'self'
              ? true
              : false,
          memberName: this.beneficiaryName,
          headofFamily_RelationID: this.relationWithHead,
          headofFamily_Relation: typeOfRelation[0].benRelationshipType,
          other: this.other,
          vanID: vanID,
          parkingPlaceID: parkingPlaceID,
          createdBy: this.sessionstorage.getItem('userName'),
        };
        this.familyTaggingService.saveFamilyTagging(requestObj).subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data) {
              this.confirmationService.alert(res.data.response, 'success');
              this.matDialogRef.close(true);
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          (err: string) => {
            this.confirmationService.alert(err, 'error');
          },
        );
      }
    }
  }

  untagFamilyMember() {
    const memberList: any[] = [];

    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

    this.selectedMembersList.filter((item) => {
      memberList.push({
        familyId: this.memberFamilyId,
        beneficiaryRegId: item.memberId,
        isHeadOfTheFamily:
          item.relationWithHead.toLowerCase() === 'self' ? true : false,
        vanID: vanID,
        parkingPlaceID: parkingPlaceID,
        modifiedBy: this.sessionstorage.getItem('userName'),
      });
    });

    const requestObj = {
      memberList: memberList,
    };
    this.familyTaggingService.untagFamilyMember(requestObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.confirmationService.alert(res.data.response, 'success');
          this.matDialogRef.close(true);
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err: string) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }
}
