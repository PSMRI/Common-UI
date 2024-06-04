import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-biometric-authentication',
  templateUrl: './biometric-authentication.component.html',
  styleUrls: ['./biometric-authentication.component.css'],
})
export class BiometricAuthenticationComponent implements OnInit {
  enableImage = false;
  messageInfo: any;

  constructor(
    public matDialogRef: MatDialogRef<BiometricAuthenticationComponent>,
  ) {}

  ngOnInit() {
    console.log('success');
  }

  connectDevice() {
    this.enableImage = true;
    this.messageInfo = 'Connecting Device...';
    //call the method to connect device discover ADVM
    let res: any;
    if (res !== undefined && res !== null && res.toLowerCase() === 'ready') {
      this.enableImage = true;
      this.messageInfo =
        'Please place your finger on the device to authenticate';
    } else {
      this.enableImage = true;
      this.messageInfo = 'Issue in connecting with the device';
    }
  }

  closeDialog() {
    this.matDialogRef.close();
    this.enableImage = false;
  }
}
