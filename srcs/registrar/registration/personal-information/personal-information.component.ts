import { Component, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CameraService } from 'src/app/app-modules/core/services';

@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.component.html',
  styleUrls: ['./personal-information.component.css']
})
export class PersonalInformationComponent {

  @Input('personalInfoFormGroup')
  personalInfoFormGroup!: FormGroup;

  @Input('formData')
  formData: any;
  patientRevisit: any;

  constructor(
    private fb: FormBuilder,
    private cameraService: CameraService
  ){}

  ngOnInit(){
    this.formData.forEach((item: any) => {
      this.personalInfoFormGroup.addControl(item.fieldName, new FormControl());
    });
    this.personalInfoFormGroup.addControl('image', new FormControl());
    console.log("personalInfoFormGroup Data", this.personalInfoFormGroup);
  }

  captureImage() {
    this.cameraService.capture().subscribe((result: any) => {
      if (result) {
        if (this.patientRevisit) {
          this.personalInfoFormGroup.patchValue({
            imageChangeFlag: true,
          });
        }
        this.personalInfoFormGroup.patchValue({ image: result });
      }
    });
  }
}
