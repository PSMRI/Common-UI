import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RegistrarService } from '../../services/registrar.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConsentFormComponent } from '../consent-form/consent-form.component';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  styleUrls: ['./other-information.component.css'],
})
export class OtherInformationComponent {
  @Input('otherInfoFormGroup')
  otherInfoFormGroup!: FormGroup;

  @Input('formData')
  formData: any;

  @Input()
  patientRevisit = false;

  @Input()
  revisitData: any;
  otherInfoSubscription!: Subscription;
  consentGranted: any;

  constructor(private fb: FormBuilder,
    private registrarService: RegistrarService,
    private dialog: MatDialog,) {
  }

  ngOnInit() {
    console.log("this.otherInfoSubscription",this.otherInfoSubscription);
    this.formData.forEach((item: any) => {
      if (item.fieldName && item.allowText) {
        this.otherInfoFormGroup.addControl(
          item.fieldName,
          new FormControl(null, [
            Validators.pattern(this.allowTextValidator(item.allowText)),
            Validators.minLength(parseInt(item?.allowMin)),
            Validators.maxLength(parseInt(item?.allowMax)),
          ])
        );
      } else {
        this.otherInfoFormGroup.addControl(
          item.fieldName,
          new FormControl(null)
        );
      }
    });
    console.log('otherInfoFormGroup Data', this.otherInfoFormGroup);
    if (this.patientRevisit)
      this.otherInfoFormGroup.patchValue(this.revisitData);
    console.log('other Form Data', this.formData);
  }

  allowTextValidator(allowText: any) {
    let regex: RegExp;

    switch (allowText) {
      case 'alpha':
        regex = /^[a-zA-Z]*$/;
        break;
      case 'numeric':
        regex = /^[0-9\-]*$/;
        break;
      case 'alphaNumeric':
        regex = /^[0-9a-zA-Z_.]+@[a-zA-Z_]+?\.\b(org|com|in|co.in|ORG|COM|IN|CO.IN)\b$/;
        break;
      default:
        regex = /^[a-zA-Z0-9 ]*$/;
        break; // Add break statement here
    }

    return regex; // Move this line outside the switch block
  }

  onInputChanged(event: Event, maxLength: any) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value;

    if (maxLength && inputValue.length >= parseInt(maxLength)) {
      // Add 'A' character when the input length exceeds the limit
      inputElement.value = inputValue.slice(0, maxLength);
    }
  }

  ngOnDestroy() {
    if (this.otherInfoSubscription) {
      this.otherInfoSubscription.unsubscribe();
    }
  }

  openConsent() {
    if (this.patientRevisit === false) {
      const matDialogRef: MatDialogRef<ConsentFormComponent> = this.dialog.open(
        ConsentFormComponent,
        {
          width: '650px',
          height: '700px',
          disableClose: true,
        },
      );
      matDialogRef.afterClosed().subscribe((consentProvided) => {
        this.consentGranted = consentProvided;
        this.registrarService.sendConsentStatus(consentProvided);
      });
    }
  }
}
