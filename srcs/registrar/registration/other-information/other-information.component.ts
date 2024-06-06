import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

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

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
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
        regex = /^[0-9]*$/;
        break;
      case 'alphaNumeric':
        regex = /^[a-zA-Z0-9]*$/;
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
}
