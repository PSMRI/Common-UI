import { Component, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-other-information',
  templateUrl: './other-information.component.html',
  styleUrls: ['./other-information.component.css']
})
export class OtherInformationComponent {

  @Input('otherInfoFormGroup')
  otherInfoFormGroup!: FormGroup;

  @Input('formData')
  formData: any;

  constructor(
    private fb: FormBuilder
  ){}

  ngOnInit(){
    this.formData.forEach((item: any) => {
      this.otherInfoFormGroup.addControl(item.fieldName, new FormControl());
    });
    console.log("otherInfoFormGroup Data", this.otherInfoFormGroup);
  }
  
}
