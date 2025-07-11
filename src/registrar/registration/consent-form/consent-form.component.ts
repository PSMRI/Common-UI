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
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { Consent, SearchComponent } from 'Common-UI/src/registrar/search/search.component';

@Component({
  selector: 'app-consent-form',
  templateUrl: './consent-form.component.html',
  styleUrls: ['./consent-form.component.css'],
})
export class ConsentFormComponent implements OnInit {
  currentLanguageSet: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Consent,
    private router: Router,
    public httpServiceService: HttpServiceService,
    public matDialogRef: MatDialogRef<ConsentFormComponent>,
  ) {}

  ngOnInit(): void {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  closeConsent(grant: string) {
    this.router.navigate(['/registrar/search/']);
    this.matDialogRef.close(grant);
  }

  acceptConsent(grant: string) {
    this.router.navigate(['/registrar/registration']);
    this.matDialogRef.close(grant);
  }
}
