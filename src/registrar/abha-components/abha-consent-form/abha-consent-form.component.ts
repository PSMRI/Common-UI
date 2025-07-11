import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SessionStorageService } from '../../services/session-storage.service';

@Component({
  selector: 'app-abha-consent-form',
  templateUrl: './abha-consent-form.component.html',
  styleUrls: ['./abha-consent-form.component.css']
})
export class AbhaConsentFormComponent {


  // Define the checkboxes as FormControl for handling the checkbox logic
  consent = new FormControl(false);
  consent1 = new FormControl(false);  // Initially unchecked
  consent2 = new FormControl(false);
  consent3 = new FormControl(false);
  consent4 = new FormControl(false);
  consent5 = new FormControl(false);
  consent5one = new FormControl(false);
  consent5two = new FormControl(false);
  userName = this.sessionstorage.getItem('userName');

  constructor(
    public dialogRef: MatDialogRef<AbhaConsentFormComponent>,
    private sessionstorage:SessionStorageService,
    
  ) {};

  // Function to close the dialog
  closeDialog() {
    this.dialogRef.close(false);
  }

  checkAll() {
    if (this.consent.value) {
      this.consent1.setValue(true);
      this.consent2.setValue(true);
      this.consent3.setValue(true);
      this.consent4.setValue(true);
      this.consent5.setValue(true);
      this.consent5one.setValue(true);
      this.consent5two.setValue(true);
    }
  }


  // Function to check if all checkboxes are checked
  allConsentsChecked() {
    return this.consent1.value && this.consent4.value 
    && this.consent5.value && (this.consent5one.value || this.consent5two.value);
  }

  checkBenConsent(){
    if(this.consent5.value){
      this.consent5one.setValue(true);
      this.consent5two.setValue(true);
    } else {
      this.consent5one.setValue(false);
      this.consent5two.setValue(false);
    }
  }


  checkBenDoubleConsent(){
    if(this.consent5one.value || this.consent5two.value){
      this.consent5.setValue(true);
    }
  }

  submitConsent() {
    if (this.allConsentsChecked()) {
      console.log("Consent Submitted Successfully!");
      this.dialogRef.close(true);
    } else {
      console.log("Please review and accept all consents.");
      this.dialogRef.close(false);
    }
  }

}
