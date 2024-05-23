import { Component, ViewChild } from '@angular/core';
import { RegistrationService } from '../services/registration.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { PersonalInformationComponent } from './personal-information/personal-information.component';
import { RegistrarService } from '../services/registrar.service';

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
  country = { id: 1, Name: 'India' };
  step = 0;


  constructor(
    private registrationService: RegistrationService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private registrarService: RegistrarService
  ){}

  ngOnInit(){
    this.getRegistrationData();
    this.mainForm = this.fb.group({
      personalInfoForm: this.fb.group({}),
      locationInfoForm: this.fb.group({}),
      otherInfoForm: this.fb.group({}),
      abhaInfoForm: this.fb.group({}),
    });
    }

    /**
   * Accordion Expand
   */
  setStep(index: number) {
    this.step = index;
  }
    minValidator(min: number): ValidatorFn {
      return (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value === null || control.value === undefined) return null;
        const value = +control.value;
        return value >= min ? null : { minValue: { value: control.value } };
      };
    }
     
    maxValidator(max: number): ValidatorFn {
      return (control: AbstractControl): { [key: string]: any } | null => {
        if (control.value === null || control.value === undefined) return null;
        const value = +control.value;
        return value <= max ? null : { maxValue: { value: control.value } };
      };
    }

    allowTextValidator(allowText: string): ValidatorFn {
      return (control: AbstractControl): { [key: string]: any } | null => {
        if (!control.value) return null;
     
        const value = control.value;
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
            return null;
        }
     
        return regex.test(value) ? null : { allowText: { value: control.value } };
      };
    }

  addControlsToFormGroup(groupName: string, formData: any[]): void {
    const formGroup = this.mainForm.get(groupName) as FormGroup;
    formData.forEach(item => {
      const validators: any = [];
 
      if (item.allowText) {
        validators.push(this.allowTextValidator(item.allowText));
      }
 
      if (item.allowMin !== undefined) {
        validators.push(this.minValidator(item.allowMin));
      }
      if (item.allowMax !== undefined) {
        validators.push(this.maxValidator(item.allowMax));
      }
 
      const control = this.fb.control('', validators);
      formGroup.addControl(item.fieldName, control);
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
        if(res.data.length > 0){
        this.filterData(res.data);
        } else {
      this.confirmationService.alert('No Project is mapped to thi serviceline for choosed block', 'info')
        }
      }else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    })
  }

  filterData(res: any) {
    this.filteredFieldsData = res.reduce((acc: { sectionId: number; sectionName: string; fields: any[] }[], curr: any) => {
        const existingSection: any = acc.find(section => section.sectionName === curr.sectionName && section.sectionId === curr.sectionId);
        if (existingSection) {
            existingSection.fields.push({...curr});
        } else {
            acc.push({
                sectionId: curr.sectionId,
                sectionName: curr.sectionName,
                fields: [{...curr}]
            });
        }
        return acc;
    }, [])
      .map((section: any) => ({
        ...section,
        fields: section.fields.sort((a: { rank: number; }, b: { rank: number; }) => a.rank - b.rank)
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
    });
    this.addControlsToFormGroup('personalInfo', this.personalInfoData);
    this.addControlsToFormGroup('locationInfo', this.locationInfoData);
    this.addControlsToFormGroup('otherInfo', this.otherInfoData);
    // this.addControlsToFormGroup('abhaInfo', this.abhaInfoData)
    }

  onFormSubmit() {
    console.log('personalInfoFormValues - ', this.mainForm.value);
    // this.personalInfoFormValues = data;
  }

  submitBeneficiaryDetails() {
    const newDate = this.dateFormatChange();
    const valueToSend = this.mainForm.value;
    valueToSend.personalDetailsForm.dob = newDate;
    const iEMRForm: any = this.iEMRForm();
    const phoneMaps = iEMRForm.benPhoneMaps;

    // createdBy, vanID, servicePointID
    const serviceLineDetails: any = localStorage.getItem('serviceLineDetails');
    const servicePointDetails = JSON.parse(serviceLineDetails);
    iEMRForm['vanID'] = servicePointDetails.vanID;
    iEMRForm['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    iEMRForm['createdBy'] = localStorage.getItem('userName');
    phoneMaps[0]['vanID'] = servicePointDetails.vanID;
    phoneMaps[0]['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    phoneMaps[0]['createdBy'] = localStorage.getItem('userName');

    this.registrarService.submitBeneficiary(iEMRForm).subscribe((res: any) => {
      if (res.statusCode === 200) {
        this.confirmationService.alert(res.data.response, 'success');
        this.mainForm.reset();
        this.setStep(0);
      } else {
        this.confirmationService.alert(
          'issue in saving the data',
          'error'
        );
      }
    });
  }

  iEMRForm() {
    const personalForm = Object.assign(
      {},
      this.mainForm.value.personalDetailsForm
    );
    const demographicsForm = Object.assign(
      {},
      this.mainForm.value.demographicDetailsForm
    );
    const othersForm = Object.assign(
      {},
      this.mainForm.value.otherDetailsForm
    );
    // const iEMRids = this.iEMRids(othersForm.govID, othersForm.otherGovID);
    const finalForm = {
      firstName: personalForm.firstName,
      lastName: personalForm.lastName,
      dOB: personalForm.dob,
      fatherName: othersForm.fatherName,
      spouseName: personalForm.spouseName,
      motherName: othersForm.motherName,
      govtIdentityNo: null,
      govtIdentityTypeID: null,
      emergencyRegistration: false,
      titleId: null,
      benImage: personalForm.image,
      bankName: othersForm.bankName,
      branchName: othersForm.branchName,
      ifscCode: othersForm.ifscCode,
      accountNo: othersForm.accountNo,
      maritalStatusID: personalForm.maritalStatus,
      maritalStatusName: personalForm.maritalStatusName,
      ageAtMarriage: personalForm.ageAtMarriage,
      genderID: personalForm.gender,
      genderName: personalForm.genderName,
      literacyStatus: personalForm.literacyStatus,
      email: othersForm.emailID,
      providerServiceMapId: localStorage.getItem('providerServiceID'),
      providerServiceMapID: localStorage.getItem('providerServiceID'),

      i_bendemographics: {
        incomeStatusID: personalForm.income,
        incomeStatusName: personalForm.incomeName,
        monthlyFamilyIncome: personalForm.monthlyFamilyIncome,
        occupationID: personalForm.occupation,
        occupationName: personalForm.occupationOther,
        educationID: personalForm.educationQualification,
        educationName: personalForm.educationQualificationName,
        communityID: othersForm.community,
        communityName: othersForm.communityName,
        religionID: othersForm.religion,
        religionName: othersForm.religionOther,
        countryID: this.country.id,
        countryName: this.country.Name,
        stateID: demographicsForm.stateID,
        stateName: demographicsForm.stateName,
        districtID: demographicsForm.districtID,
        districtName: demographicsForm.districtName,
        blockID: demographicsForm.blockID,
        blockName: demographicsForm.blockName,
        districtBranchID:
          demographicsForm.villages[0].villageID.districtBranchID,
        districtBranchName: demographicsForm.villages[0].villageID.villageName,
        zoneID: demographicsForm.zoneID,
        zoneName: demographicsForm.zoneName,
        parkingPlaceID: demographicsForm.parkingPlace,
        parkingPlaceName: demographicsForm.parkingPlaceName,
        servicePointID: localStorage.getItem('servicePointID'),
        servicePointName: localStorage.getItem('servicePointName'),
        habitation: demographicsForm.habitation,
        pinCode: demographicsForm.pincode,
        addressLine1: demographicsForm.addressLine1,
        addressLine2: demographicsForm.addressLine2,
        addressLine3: demographicsForm.addressLine3,
      },
      benPhoneMaps: [
        {
          parentBenRegID: personalForm.parentRegID,
          phoneNo: personalForm.phoneNo,
          phoneTypeID: this.makePhoneTypeID(personalForm.phoneNo),
          benRelationshipID: personalForm.parentRelation,
        },
      ],
      // beneficiaryIdentities: iEMRids,
    };
    return finalForm;
  }

  makePhoneTypeID(phoneNo: any) {
    if (phoneNo) {
      return 1;
    } else {
      return null;
    }
  }

  updateBenDataManipulation() {
    const newDate = this.dateFormatChange();
    const valueToSend = this.mainForm.value;
    valueToSend.personalDetailsForm.dob = newDate;
    const iEMRForm: any = this.iEMRFormUpdate();
    const phoneMaps = iEMRForm.benPhoneMaps;

    const serviceLineDetails: any = localStorage.getItem('serviceLineDetails');
    const servicePointDetails = JSON.parse(serviceLineDetails);

    iEMRForm['vanID'] = servicePointDetails.vanID;
    iEMRForm['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    iEMRForm['createdBy'] = localStorage.getItem('userName');
    phoneMaps[0]['vanID'] = servicePointDetails.vanID;
    phoneMaps[0]['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    phoneMaps[0]['modifiedBy'] = localStorage.getItem('userName');
    return iEMRForm;
  }

  iEMRFormUpdate() {
    const personalForm = Object.assign(
      {},
      this.mainForm.value.personalDetailsForm
    );
    const demographicsForm = Object.assign(
      {},
      this.mainForm.value.demographicDetailsForm
    );
    const othersForm = Object.assign(
      {},
      this.mainForm.value.otherDetailsForm
    );
    // const removedIDs = this.otherDetails.getRemovedIDs();
    // const iEMRids = this.iEMRidsUpdate(
    //   othersForm.govID,
    //   othersForm.otherGovID,
    //   removedIDs.removedGovIDs,
    //   removedIDs.removedOtherGovIDs
    // );
    const finalForm = {
      beneficiaryRegID: personalForm.beneficiaryRegID,
      i_bendemographics: {
        beneficiaryRegID: personalForm.beneficiaryRegID,
        educationID: personalForm.educationQualification || undefined,
        educationName: personalForm.educationQualificationName || undefined,
        i_beneficiaryeducation: {
          educationID: personalForm.educationQualification || undefined,
          educationType: personalForm.educationQualificationName || undefined,
        },
        occupationID: personalForm.occupation || undefined,
        occupationName: personalForm.occupationOther || undefined,
        communityID: othersForm.community || undefined,
        communityName: othersForm.communityName || undefined,
        m_community: {
          communityID: othersForm.community || undefined,
          communityType: othersForm.communityName || undefined,
        },
        religionID: othersForm.religion || undefined,
        religionName: othersForm.religionOther || undefined,
        addressLine1: demographicsForm.addressLine1 || undefined,
        addressLine2: demographicsForm.addressLine2 || undefined,
        addressLine3: demographicsForm.addressLine3 || undefined,
        stateID: demographicsForm.stateID,
        stateName: demographicsForm.stateName,
        m_state: {
          stateID: demographicsForm.stateID,
          stateName: demographicsForm.stateName,
          stateCode: demographicsForm.stateCode,
          countryID: demographicsForm.countryID,
        },
        districtID: demographicsForm.districtID,
        districtName: demographicsForm.districtName,
        m_district: {
          districtID: demographicsForm.districtID,
          stateID: demographicsForm.stateID,
          districtName: demographicsForm.districtName,
        },
        blockID: demographicsForm.blockID,
        blockName: demographicsForm.blockName,
        m_districtblock: {
          blockID: demographicsForm.blockID,
          districtID: demographicsForm.districtID,
          blockName: demographicsForm.blockName,
          stateID: demographicsForm.stateID,
        },
        districtBranchID:
          demographicsForm.villages[0].villageID.districtBranchID,
        districtBranchName: demographicsForm.villages[0].villageID.villageName,
        m_districtbranchmapping: {
          districtBranchID: demographicsForm.villageID,
          blockID: demographicsForm.blockID,
          villageName: demographicsForm.villageName,
        },
        pinCode: demographicsForm.pincode || undefined,
        createdBy: localStorage.getItem('userName'),
        zoneID: demographicsForm.zoneID,
        zoneName: demographicsForm.zoneName,
        parkingPlaceID: demographicsForm.parkingPlace,
        parkingPlaceName: demographicsForm.parkingPlaceName,
        servicePointID: localStorage.getItem('servicePointID'),
        servicePointName: localStorage.getItem('servicePointName'),
        habitation: demographicsForm.habitation || undefined,
        incomeStatusID: personalForm.income || undefined,
        incomeStatus: personalForm.incomeName || undefined,
        incomeStatusName: personalForm.incomeName || undefined,
        monthlyFamilyIncome: personalForm.monthlyFamilyIncome || undefined,
      },
      benPhoneMaps: [
        {
          benPhMapID: this.getBenPhMapID(personalForm.benPhMapID),
          benificiaryRegID: personalForm.beneficiaryRegID,
          parentBenRegID: personalForm.parentRegID,
          benRelationshipID: personalForm.parentRelation,
          benRelationshipType: {
            benRelationshipID: personalForm.parentRelation,
            benRelationshipType: this.getRelationTypeForUpdate(
              personalForm.parentRelation,
              personalForm.benRelationshipType
            ),
          },
          phoneNo: personalForm.phoneNo,
        },
      ],
      beneficiaryID: personalForm.beneficiaryID,
      m_title: {},
      firstName: personalForm.firstName,
      lastName: personalForm.lastName || undefined,
      genderID: personalForm.gender,
      m_gender: {
        genderID: personalForm.gender,
        genderName: personalForm.genderName,
      },
      maritalStatusID: personalForm.maritalStatus || undefined,
      maritalStatus: {
        maritalStatusID: personalForm.maritalStatus || undefined,
        status: personalForm.maritalStatusName || undefined,
      },
      dOB: personalForm.dob,
      fatherName: othersForm.fatherName || undefined,
      spouseName: personalForm.spouseName || undefined,
      changeInSelfDetails: true,
      changeInAddress: true,
      changeInContacts: true,
      changeInIdentities: true,
      changeInOtherDetails: true,
      changeInFamilyDetails: true,
      changeInAssociations: true,
      is1097: false,
      createdBy: localStorage.getItem('userName'),
      changeInBankDetails: true,
      ageAtMarriage: personalForm.ageAtMarriage || undefined,
      literacyStatus: personalForm.literacyStatus || undefined,
      motherName: othersForm.motherName || undefined,
      email: othersForm.emailID || undefined,
      bankName: othersForm.bankName || undefined,
      branchName: othersForm.branchName || undefined,
      ifscCode: othersForm.ifscCode || undefined,
      accountNo: othersForm.accountNo || undefined,
      benAccountID: personalForm.benAccountID,
      benImage: personalForm.image,
      changeInBenImage: personalForm.imageChangeFlag,
      occupationId: personalForm.occupation || undefined,
      occupation: personalForm.occupationOther || undefined,
      incomeStatus: personalForm.incomeName || undefined,
      religionId: othersForm.religion || undefined,
      religion: othersForm.religionOther || undefined,
      providerServiceMapId: localStorage.getItem('providerServiceID'),
      providerServiceMapID: localStorage.getItem('providerServiceID'),
    };

    return finalForm;
  }

  getBenPhMapID(benPhMapID: any) {
    if (benPhMapID === 'null') {
      return null;
    } else {
      return benPhMapID;
    }
  }
  getRelationTypeForUpdate(parentRelation: any, benRelationshipType: any) {
    if (parentRelation === 1) {
      return 'Self';
    } else if (parentRelation === 11) {
      return 'Other';
    } else {
      return null;
    }
  }

  dateFormatChange() {
    const dob = new Date(
      (<FormGroup>(
        this.mainForm.controls['personalDetailsForm']
      )).value.dob
    );
    return dob.toISOString();
  }


}
