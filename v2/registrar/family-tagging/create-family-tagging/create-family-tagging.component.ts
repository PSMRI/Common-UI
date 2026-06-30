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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgIf, NgFor } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { FamilyTaggingService } from '../../services/familytagging.service';
import { SessionStorageService } from '../../services/session-storage.service';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';

@Component({
  selector: 'app-create-family-tagging',
  templateUrl: './create-family-tagging.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...ZardSelectImports,
  ],
  viewProviders: [provideIcons({ lucideX })],
})
export class CreateFamilyTaggingComponent implements OnInit, DoCheck {
  @ViewChild('newFamilyTaggingForm') form: any;
  currentLanguageSet: any;
  newFamilyTaggingForm!: FormGroup;
  objs: any = [];
  relationWithHeadOfFamilyID = [];
  relationWithHeadOfFamily: any;
  isHeadOfFamilies = ['yes', 'No'];
  relationShipType: any[] = [];
  relationShipList: any;
  enableOther!: boolean;
  otherRelation: any;
  familyHead: any;
  familyName: any;
  benRelationshipID: any;
  getCreatedFamilyDetails: any;
  benFamilyName: any;
  benFamilyID: any;
  beneficiaryRegID: any;
  beneficiaryName: any;
  isHeadOfTheFamily!: string;
  benVillageId: any;
  countryId = 1;

  constructor(
    public matDialogRef: MatDialogRef<CreateFamilyTaggingComponent>,
    public httpServiceService: HttpServiceService,
    private familyTaggingService: FamilyTaggingService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private sessionstorage: SessionStorageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.benFamilyName = this.data.benFamilyName;
    this.benFamilyID = this.data.benFamilyID;
    this.beneficiaryRegID = this.data.benRegId;
    this.beneficiaryName = this.data.beneficiaryName;
    this.benVillageId = this.data.benVillageId;
    this.assignSelectedLanguage();
    this.CreatenewFamilyTaggingForm();
    this.getSurname();
    this.getRelationShipMaster();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  CreatenewFamilyTaggingForm() {
    this.newFamilyTaggingForm = this.fb.group({
      familyName: null,
      isHeadOfTheFamily: null,
      relationWithHeadOfFamily: null,
      otherRelation: null,
    });
  }

  ResetForm() {
    this.form.reset();
    this.enableOther = false;
  }

  getSurname() {
    this.familyName = this.benFamilyName;
  }

  /**
   * The z-select CVA writes its option value as a string, but the relationship
   * logic below (createNewFamilyTagging filter, checkOtherRelation, and the
   * value set in populateRelation) compares against the numeric
   * benRelationshipID. Coerce the just-selected value back to a number so the
   * existing strict-equality comparisons keep working unchanged.
   */
  coerceRelationNumber(value: string | string[]) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw !== null && raw !== undefined && raw !== '') {
      this.relationWithHeadOfFamily = Number(raw);
    } else {
      this.relationWithHeadOfFamily = null;
    }
  }

  createNewFamilyTagging() {
    const typeOfRelation = this.relationShipType.filter((item) => {
      if (item.benRelationshipID === this.relationWithHeadOfFamily) return item;
    });
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const reqObject = {
      beneficiaryRegId: this.beneficiaryRegID,
      familyName: this.familyName,
      headofFamily_RelationID: this.relationWithHeadOfFamily,
      headofFamily_Relation: typeOfRelation[0].benRelationshipType,
      familyHeadName:
        this.isHeadOfTheFamily === 'yes' ? this.beneficiaryName : null,
      other: this.otherRelation,
      villageId: parseInt(this.benVillageId),
      vanID: vanID,
      parkingPlaceID: parkingPlaceID,
      createdBy: this.sessionstorage.getItem('userName'),
    };
    console.log('Details to be saved', reqObject);
    this.familyTaggingService.createFamilyTagging(reqObject).subscribe(
      (response: any) => {
        if (response.statusCode === 200 && response.data) {
          this.confirmationService.alert(
            this.currentLanguageSet.familyCreatedSuccessfully,
            'success',
          );
          this.getCreatedFamilyDetails = response.data;
          this.matDialogRef.close(this.getCreatedFamilyDetails);
        } else {
          this.confirmationService.alert(response.errorMessage, 'error');
          this.matDialogRef.close(false);
        }
      },
      (err: string) => {
        this.confirmationService.alert(err, 'error');
        this.matDialogRef.close(false);
      },
    );
  }

  getRelationShipMaster() {
    this.familyTaggingService
      .getRelationShips(this.countryId)
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
    this.relationShipList = [];
    this.enableOther = false;
    this.otherRelation = null;

    if (isHead.toLowerCase() === 'yes') {
      const relation = this.relationShipType.filter((item) => {
        if (item.benRelationshipType.toLowerCase() === 'self') {
          this.relationShipList.push(item);
          return item.benRelationshipID;
        }
      });
      this.relationWithHeadOfFamily = relation[0].benRelationshipID;
    } else {
      this.relationShipType.filter((item) => {
        if (item.benRelationshipType.toLowerCase() !== 'self') {
          this.relationShipList.push(item);
        }
      });

      this.relationWithHeadOfFamily = null;
    }
  }
  checkOtherRelation(relationValue: any) {
    this.otherRelation = null;
    const relationTypeValue = this.relationShipType.filter((item) => {
      if (item.benRelationshipType.toLowerCase() === 'other') {
        return item;
      }
    });

    if (relationTypeValue[0].benRelationshipID === relationValue) {
      this.enableOther = true;
    } else {
      this.enableOther = false;
    }
  }
}
