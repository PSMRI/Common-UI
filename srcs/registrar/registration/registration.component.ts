import { Component, ViewChild } from '@angular/core';
import { RegistrationService } from '../services/registration.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PersonalInformationComponent } from './personal-information/personal-information.component';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {

  filteredFieldsData: any = [];
  enablePersonalInfo = false;
  enableLocationInfo = false;
  enableOtherInfo = false;
  enableAbhaInfo = false;
  personalInfoData: any;
  locationInfoData: any;
  otherInfoData: any;
  personalInfoFormValues: any;
  mainForm!: FormGroup;


  constructor(
    private registrationService: RegistrationService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ){}

  ngOnInit(){
    this.getRegistrationData();
    this.mainForm = this.fb.group({
      personalInfoForm: this.fb.group({}),
      locationInfoForm: this.fb.group({}),
      otherInfoForm: this.fb.group({}),
      abhaInfoForm: this.fb.group({}),
    });
    this.addControlsToFormGroup('personalInfo', this.personalInfoData);
    this.addControlsToFormGroup('locationInfo', this.locationInfoData);
    this.addControlsToFormGroup('otherInfo', this.otherInfoData);
    // this.addControlsToFormGroup('abhaInfo', this.abhaInfoData);
    
    this.getRegistrationData();
  }

  addControlsToFormGroup(groupName: string, formData: any[]): void {
    const formGroup = this.mainForm.get(groupName) as FormGroup;
    formData.forEach(field => {
      formGroup.addControl(field.fieldName, new FormControl(''));
    });
  }

  get personalInfoFormGroup(): FormGroup{
    return this.mainForm.get('personalInfoForm') as FormGroup;
  }

  get locationInfoFormGroup(): FormGroup{
    return this.mainForm.get('locationInfoForm') as FormGroup;
  }

  get otherInfoFormGroup(): FormGroup{
    return this.mainForm.get('otherInfoForm') as FormGroup;
  }

  getRegistrationData(){
    let location: any = localStorage.getItem('locationData');
    let locationData = JSON.parse(location);
    let services: any = localStorage.getItem('services');
    let servicesData = JSON.parse(services);
    console.log('servicesData', servicesData);
    let reqObj = {
      serviceLine: localStorage.getItem('serviceName'),
      serviceLineId: localStorage.getItem('serviceID'),
      stateId: locationData.stateID,
      districtId: locationData.districtID,
      blockId: locationData.blockID,
      serviceProviderId: servicesData[0].serviceProviderID
    }
    console.log('reqObj', reqObj);
    this.registrationService.fetchAllRegistrationData(reqObj).subscribe((res: any) => {
      if(res && res.data && res.statusCode === 200){
        this.filterData(res.data);
      }else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    })
  }

  filterData(res: any) {
    this.filteredFieldsData = res.reduce((acc: { sectionId: number; sectionName: string; fields: any[] }[], curr: any) => {
        const existingSection: any = acc.find(section => section.sectionName === curr.sectionName);
        if (existingSection) {
            existingSection.fields.push({...curr});
        } else {
            acc.push({
                sectionId: curr.sectionid,
                sectionName: curr.sectionName,
                fields: [{...curr}]
            });
        }
        return acc;
    }, [])
      .map((section: any) => ({
        ...section,
        fields: section.fields.sort((a: { fieldRank: number; }, b: { fieldRank: number; }) => a.fieldRank - b.fieldRank)
    }));
    console.log("filtered data", this.filteredFieldsData);
    this.enableSteps();
  }

  enableSteps(){
    this.filteredFieldsData.find((item: any) => {
      if(item.sectionName.toLowerCase() === "personal information"){
      this.enablePersonalInfo = true;
      this.personalInfoData = item.fields;
      }
      if(item.sectionName.toLowerCase() === "location information"){
      this.enableLocationInfo = true;
      this.locationInfoData = item.fields;
      }
      if(item.sectionName.toLowerCase() === "other information"){
      this.enableOtherInfo = true;
      this.otherInfoData = item.fields;
      }
      if(item.sectionName.toLowerCase() === "abha information"){
      this.enableAbhaInfo = true;
      }
    })
  }

  onFormSubmit() {
    console.log('personalInfoFormValues - ', this.mainForm.value);
    // this.personalInfoFormValues = data;
  }
}
