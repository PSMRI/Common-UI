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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { environment } from 'src/environments/environment';

@Injectable()
export class RegistrarService {
  registrationMasterDetails = new BehaviorSubject<any>(null);
  registrationMasterDetails$ = this.registrationMasterDetails.asObservable();

  beneficiaryDetails = new BehaviorSubject<any>(null);
  beneficiaryDetails$ = this.beneficiaryDetails.asObservable();

  beneficiaryEditDetails = new BehaviorSubject<any>(null);
  beneficiaryEditDetails$ = this.beneficiaryEditDetails.asObservable();

  constructor(private http: HttpClient) {}

  getRegistrationMaster(servicePointID: any) {
    const tmpSPID = { spID: servicePointID };
    return this.http
      .post(environment.registrarMasterDataUrl, tmpSPID)
      .subscribe((res: any) => {
        console.log(JSON.stringify(res.data), 'json data');
        if (res.data) this.registrationMasterDetails.next(res.data);
      });
  }

  getPatientDataAsObservable(benRegID: any) {
    return this.http
      .post(environment.getCompleteBeneficiaryDetail, {
        beneficiaryRegID: benRegID,
      })
      .subscribe((res: any) => {
        if (res.data) {
          console.log(res.data, 'res json data');
          this.beneficiaryDetails.next(res.data);
        }
      });
  }

  getPatientData(benRegID: any) {
    return this.http.post(environment.getCompleteBeneficiaryDetail, {
      beneficiaryRegID: benRegID,
    });
  }

  registerBeneficiary(beneficiary: any) {
    const benData = { benD: beneficiary };
    return this.http.post(environment.registerBeneficiaryUrl, benData);
  }

  quickSearch(searchTerm: any) {
    return this.http.post(environment.quickSearchUrl, searchTerm);
  }

  identityQuickSearch(searchTerm: any) {
    return this.http.post(environment.identityQuickSearchUrl, searchTerm);
  }

  // quickSearchByPhoneNO(searchTerm: any) {
  //   return this.http.get(environment.quickSearchUrl, searchTerm)
  //     .map((res) => res.data);
  // }

  clearBeneficiaryEditDetails() {
    this.beneficiaryEditDetails.next(null);
  }

  saveBeneficiaryEditDataASobservable(beneficiary: any) {
    this.beneficiaryEditDetails.next(beneficiary);
  }

  advanceSearch(searchTerms: any) {
    return this.http.post(environment.advanceSearchUrl, searchTerms);
  }

  advanceSearchIdentity(searchTerms: any) {
    return this.http.post(environment.advanceSearchIdentityUrl, searchTerms);
  }

  loadMasterData(servicePointID: any) {
    const tmpSPID = { spID: servicePointID };
    return this.http.post(environment.registrarMasterDataUrl, tmpSPID);
  }

  patientRevisit(benRegID: any) {
    return this.http.post(environment.patientRevisitSubmitToNurse, benRegID);
  }

  identityPatientRevisit(ben: any) {
    return this.http.post(
      environment.identityPatientRevisitSubmitToNurseURL,
      ben
    );
  }

  updatePatientData(beneficiary: any) {
    return this.http.post(environment.updateBeneficiaryUrl, beneficiary);
  }

  getDistrictBlocks(servicePointID: any) {
    return this.http.post(environment.servicePointVillages, {
      servicePointID: servicePointID,
    });
  }

  submitBeneficiary(iEMRForm: any) {
    return this.http.post(environment.submitBeneficiaryIdentityUrl, iEMRForm);
  }

  updateBeneficiary(iEMRForm: any) {
    return this.http.post(environment.updateBeneficiaryIdentityUrl, iEMRForm);
  }

  getVillageList(blockId: any) {
    return this.http.get(`${environment.getVillageListUrl}${blockId}`);
  }

  getSubDistrictList(districtId: any) {
    return this.http.get(`${environment.getSubDistrictListUrl}${districtId}`);
  }

  getDistrictList(stateId: any) {
    return this.http.get(`${environment.getDistrictListUrl}${stateId}`);
  }
  /*New code for fetching District and Taluk*/
  getDistrictTalukList(villageID: any) {
    return this.http.get(`${environment.getDistrictTalukUrl}${villageID}`);
  }
}
