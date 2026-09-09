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

import { Component, Inject } from '@angular/core';
import { ZardDialogRef, Z_MODAL_DATA } from 'Common-UI/v2/ui/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NgIf } from '@angular/common';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardLoaderComponent } from 'Common-UI/v2/ui/loader';

@Component({
  selector: 'app-display-abha-card',
  templateUrl: './display-abha-card.component.html',
  standalone: true,
  imports: [NgIf, NgIcon, ZardButtonComponent, ZardLoaderComponent],
  viewProviders: [provideIcons({ lucideX })],
})
export class DisplayAbhaCardComponent {

  imageSrc: any;
  showProgressBar = false;
  base64Png: any;
  blobUrl: any;
  currentLanguageSet: any;

  constructor(
    public dialogRef: ZardDialogRef<DisplayAbhaCardComponent>,
    @Inject(Z_MODAL_DATA) public data: any,
    public httpServiceService: HttpServiceService,
    public sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
  ) {
  }

  ngOnInit(): void {
    this.assignSelectedLanguage();
    this.showProgressBar = true;
    if (this.data && this.data.png) {
      const escapedPngData = this.data.png;
      this.convertEscapedPngToBase64(escapedPngData);
    } else {
      this.confirmationService.alert("Issue while getting png card", 'error');
    }
    this.showProgressBar = false;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }


  convertEscapedPngToBase64(escapedString: string): void {
    try {
      // Decode the escaped Unicode string into binary
      const binaryString = escapedString.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
        String.fromCharCode(parseInt(code, 16))
      );
      // Convert the binary string into a Uint8Array
      const binaryData = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
      // Create a Blob with the MIME type image/png
      const blob = new Blob([binaryData], { type: 'image/png' });
      // Generate a Blob URL
      this.blobUrl = URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error displaying PNG:', error);
      this.blobUrl = null;
    }
  }

  transform() {
    const imgBaseUrl = 'data:image/png;base64, ' + this.data.png;
    return this.sanitizer.bypassSecurityTrustResourceUrl(imgBaseUrl);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  downloadImage() {
    const link = document.createElement('a');
    link.href = this.blobUrl;
    link.download = 'image.png';
    link.click();
  }



}
