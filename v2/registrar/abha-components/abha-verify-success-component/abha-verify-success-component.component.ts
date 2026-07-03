/*
 * AMRIT – Accessible Medical Records via Integrated Technologies
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

import { Component, Inject, ViewContainerRef } from '@angular/core';
import { ZardDialogRef, Z_MODAL_DATA, ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideX } from '@ng-icons/lucide';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { DisplayAbhaCardComponent } from '../display-abha-card/display-abha-card.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { NgIf } from '@angular/common';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardLoaderComponent } from 'Common-UI/v2/ui/loader';
import { cardImports } from 'Common-UI/v2/ui/card';

@Component({
  selector: 'app-abha-verify-success-component',
  templateUrl: './abha-verify-success-component.component.html',
  standalone: true,
  imports: [NgIf, NgIcon, ZardButtonComponent, ZardLoaderComponent, ...cardImports],
  viewProviders: [provideIcons({ lucideCircleCheck, lucideX })],
})
export class AbhaVerifySuccessComponentComponent {

  currentLanguageSet: any;
  showProgressBar = false;

  constructor(
    public dialogSucRef: ZardDialogRef<AbhaVerifySuccessComponentComponent>,
    @Inject(Z_MODAL_DATA) public data: any,
    private readonly dialog: ZardDialogService,
    private readonly viewContainerRef: ViewContainerRef,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService
  ) { }

  abhaDetails: any;
  xToken: any;

  ngOnInit() {
    this.assignSelectedLanguage();
    if (this.data.abhaResponse) {
      this.abhaDetails = this.data.abhaResponse;
    }
    if (this.data.xToken) {
      this.xToken = this.data.xToken;
    }
  }

  closeDialog() {
    this.dialogSucRef.close(true);
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  downloadPngCard() {
    this.dialogSucRef.close(true);
    let png = null;
    this.showProgressBar = true;
    let reqObj = {
      xToken: this.data.xToken
    }
    this.registrarService.printPngCard(reqObj, this.data.loginHint).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        png = res.data.png;
        this.displayAbhaCard(png);
      } else {
        this.confirmationService.alert(this.currentLanguageSet.issueInAbhaCard, 'error');
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    });
  }

  displayAbhaCard(png: any) {
    this.dialog.create({
      zContent: DisplayAbhaCardComponent,
      zData: { png: png },
      zWidth: 'auto',
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
  }

}
