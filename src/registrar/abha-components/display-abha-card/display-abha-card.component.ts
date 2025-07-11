import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-display-abha-card',
  templateUrl: './display-abha-card.component.html',
  styleUrls: ['./display-abha-card.component.css']
})
export class DisplayAbhaCardComponent {

  imageSrc: any;
  showProgressBar = false;
  base64Png: any;
  blobUrl: any;
  currentLanguageSet: any;

  constructor(
    public dialogRef: MatDialogRef<DisplayAbhaCardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public httpServiceService: HttpServiceService,
    private dialog: MatDialog,
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
