import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-location-information',
  templateUrl: './location-information.component.html',
  styleUrls: ['./location-information.component.css']
})
export class LocationInformationComponent {
    
  @Input('locationInfoFormGroup')
  locationInfoFormGroup!: FormGroup;

  @Input('formData')
  formData: any;


  constructor(
    private fb: FormBuilder
  ){}

  ngOnInit(){
    this.formData.forEach((item: any) => {
      this.locationInfoFormGroup.addControl(item.fieldName, new FormControl());
    });
    console.log("location Data", this.locationInfoFormGroup);
  }
}
