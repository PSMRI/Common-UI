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
import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-view-health-id-card',
  templateUrl: './view-health-id-card.component.html',
  styleUrls: ['./view-health-id-card.component.css'],
})
export class ViewHealthIdCardComponent implements OnInit, DoCheck {
  imgUrl: any;
  currentLanguageSet: any;
  constructor(
    public dialogSucRef: MatDialogRef<ViewHealthIdCardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sanitizer: DomSanitizer,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  transform() {
    const imgBaseUrl = 'data:image/png;base64, ' + this.data.imgBase64;
    return this.sanitizer.bypassSecurityTrustResourceUrl(imgBaseUrl);
  }

  convertIMGToPDF(baseResponse: string | undefined) {
    if (baseResponse !== undefined) {
      const byteCharacters = atob(baseResponse);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob1 = new Blob([byteArray], { type: 'application/pdf;base64' });

      const fileURL = URL.createObjectURL(blob1);
      this.imgUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
    }
  }

  closeDialog() {
    this.dialogSucRef.close();
  }

  downloadHealthIDCard() {
    const srcFilePath = this.data.imgBase64.replace(
      'data:image/png;base64, ',
      '',
    );
    const blobData = this.convertBase64ToBlobData(srcFilePath);

    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      //IE
      (window.navigator as any).msSaveOrOpenBlob(blobData, 'ABHACard');
    } else {
      // chrome
      const blob = new Blob([blobData], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ABHACard';
      link.click();
    }
  }

  convertBase64ToBlobData(base64Data: string) {
    const contentType = 'image/png';
    const sliceSize = 512;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  downloadPdf(base64String: string, fileName: any) {
    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
      // download PDF in IE
      const byteChar = atob(base64String);
      const byteArray = new Array(byteChar.length);
      for (let i = 0; i < byteChar.length; i++) {
        byteArray[i] = byteChar.charCodeAt(i);
      }
      const uIntArray = new Uint8Array(byteArray);
      const blob = new Blob([uIntArray], { type: 'application/pdf' });
      (window.navigator as any).msSaveOrOpenBlob(blob, `${fileName}.pdf`);
    } else {
      // Download PDF in Chrome etc.
      const source = `data:application/pdf;base64,${base64String}`;
      const link = document.createElement('a');
      link.href = source;
      link.download = `${fileName}.pdf`;
      link.click();
    }
  }
}
