import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmationService } from 'src/app/app-modules/core/services';

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

  constructor(
    public dialogRef: MatDialogRef<DisplayAbhaCardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    public sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
  ) {
  }

  ngOnInit(): void {
    this.showProgressBar = true;
    if (this.data && this.data.png) {
      const escapedPngData = this.data.png;
      this.convertEscapedPngToBase64(escapedPngData);
    } else {
      this.confirmationService.alert("Issue while getting png card", 'error');
    }
    this.showProgressBar = false;
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
  // convertEscapedPngToBase64(escapedString: string): string {
  //   const binaryString = escapedString
  //     .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
  //     .replace(/\\n/g, '\n')
  //     .replace(/\\r/g, '\r')
  //     .replace(/\\t/g, '\t');
  //   // Convert binary string to a Uint8Array
  //   console.log("escaped string length", escapedString.length);
  //   console.log("binary string length", binaryString.length);
  //   const binaryData = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
  //   // Create a Blob and use URL.createObjectURL
  //   const blob = new Blob([binaryData], { type: 'image/png' });
  //   return URL.createObjectURL(blob); // Use this URL as the src for <img>
  //  }

  // convertEscapedPngToBase64(escapedString: string): string {
  //   // Step 1: Decode the escaped Unicode string into a binary string
  //   const binaryString = escapedString
  //     .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
  //     .replace(/\\n/g, '\n')
  //     .replace(/\\r/g, '\r')
  //     .replace(/\\t/g, '\t');
  //   // Step 2: Encode the binary string into Base64
  //   const base64String = btoa(binaryString);
  //   return `data:image/png;base64,${base64String}`;
  //  }

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
