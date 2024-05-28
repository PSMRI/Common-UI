import { Component, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService, CameraService, ConfirmationService } from 'src/app/app-modules/core/services';
import { RegistrarService } from '../../services/registrar.service';
import { Subscription } from 'rxjs';
import moment from 'moment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

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

  @Input()
  patientRevisit = false;

  @Input()
  revisitData: any;

  masterDataSubscription!: Subscription;
  masterData: any;
  revisitDataSubscription!: Subscription;
  _parentBenRegID: any;
  dateForCalendar: any;
  currentLanguageSet: any;
  ageforMarriage: any;
  today: any;
  ageLimit: any;
  maritalStatusMaster: any;

  constructor(
    private fb: FormBuilder,
    private cameraService: CameraService,
    private registrarService: RegistrarService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    private languageComponent: SetLanguageComponent

  ){}

  ngOnInit(){
    this.formData.forEach((item: any) => {
      if(item.fieldName)
      this.personalInfoFormGroup.addControl(item.fieldName, new FormControl());
    });
    this.personalInfoFormGroup.addControl('image', new FormControl());
    console.log("personalInfoFormGroup Data", this.personalInfoFormGroup);
    if(this.patientRevisit)
    this.personalInfoFormGroup.patchValue(this.revisitData);
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

    /**
   *
   * Load Basic Master Data Observable
   */
    loadMasterDataObservable() {
      this.masterDataSubscription =
        this.registrarService.registrationMasterDetails$.subscribe(res => {
          // console.log('res personal', res)
          if (res !== null) {
            this.masterData = res;
            console.log('masterData', )
            if (this.patientRevisit) {
              this.loadPersonalDataForEditing();
            }
          }
        });
    }

      /**
   *
   * Load Personal Details Componen Details
   *
   */
  loadPersonalDataForEditing() {
    this.revisitDataSubscription =
      this.registrarService.beneficiaryEditDetails$.subscribe(res => {
        if (res && res.beneficiaryID) {
          this.revisitData = Object.assign({}, res);
          this.validateMaritalStatusMaster(this.revisitData);
          this.pushEditingDatatoForm(Object.assign({}, this.revisitData));
          this.getBenImage();
        }
      });
  }

    onGenderSelected() {
      const genderMaster = this.masterData.genderMaster;
      genderMaster.forEach((element: any, i: any) => {
        if (element.genderID === this.personalInfoFormGroup.value.gender) {
          this.personalInfoFormGroup.patchValue({
            genderName: element.genderName,
          });
        }
      });
      console.log(
        'this.masterData',
        genderMaster,
        this.masterData.maritalStatusMaster
      );
  
      if (this.personalInfoFormGroup.value.gender === 3) {
        this.confirmationService
          .confirm('info', 'You have selected Transgender, please confirm')
          .subscribe(
            res => {
              if (!res) {
                this.personalInfoFormGroup.patchValue({
                  gender: null,
                  genderName: null,
                });
              } else {
                this.maritalStatusMaster = this.masterData.maritalStatusMaster;
              }
            },
            err => {}
          );
      } else {
        this.maritalStatusMaster = this.masterData.maritalStatusMaster.filter(
          (maritalStatus: any) => {
            if (
              this.personalInfoFormGroup.value.gender === 1 &&
              maritalStatus.maritalStatusID !== 5
            ) {
              return maritalStatus;
            }
            if (
              this.personalInfoFormGroup.value.gender === 2 &&
              maritalStatus.maritalStatusID !== 6
            ) {
              return maritalStatus;
            }
          }
        );
      }
    }

    
  validateMaritalStatusMaster(revisitData: any) {
    if (revisitData.m_gender.genderID === 3) {
      this.maritalStatusMaster = this.masterData.maritalStatusMaster;
    } else {
      this.maritalStatusMaster = this.masterData.maritalStatusMaster.filter(
        (maritalStatus: any) => {
          if (
            revisitData.m_gender.genderID === 1 &&
            maritalStatus.maritalStatusID !== 5
          ) {
            return maritalStatus;
          }
          if (
            revisitData.m_gender.genderID === 2 &&
            maritalStatus.maritalStatusID !== 6
          ) {
            return maritalStatus;
          }
        }
      );
    }
  }

  
    changeLiteracyStatus() {
      const literacyStatus = this.personalInfoFormGroup.value.literacyStatus;
  
      if (literacyStatus !== 'Literate') {
        console.log(this.personalInfoFormGroup.controls, 'controls');
        // this.personalInfoFormGroup.controls['educationQualification'].clearValidators();
        console.log(
          this.personalInfoFormGroup.controls['educationQualification'],
          'controls'
        );
      } else {
        this.personalInfoFormGroup.controls['educationQualification'].reset();
      }
    }
  
    /**
     * Phone Number Parent Relations
     */
    getParentDetails() {
      const searchTerm = this.personalInfoFormGroup.value.phoneNo;
      const searchObject = {
        beneficiaryRegID: null,
        beneficiaryID: null,
        phoneNo: null,
      };
      if (searchTerm && searchTerm.trim().length === 10) {
        searchObject['phoneNo'] = searchTerm;
        this.registrarService.identityQuickSearch(searchObject).subscribe(
          (beneficiaryList: any) => {
            if (
              beneficiaryList &&
              beneficiaryList.length > 0 &&
              beneficiaryList[0].benPhoneMaps.length > 0
            ) {
              console.log(
                'ta d ad a d a',
                JSON.stringify(beneficiaryList, null, 4)
              );
              this.personalInfoFormGroup.patchValue({
                parentRegID: beneficiaryList[0].benPhoneMaps[0].parentBenRegID,
                parentRelation: 11,
              });
              console.log(this.personalInfoFormGroup.value.parentRegID);
            } else {
              this.personalInfoFormGroup.patchValue({
                parentRegID: null,
                parentRelation: 1,
              });
              console.log(this.personalInfoFormGroup.value.parentRegID);
  
              if (this.patientRevisit) {
                this.personalInfoFormGroup.patchValue({
                  parentRegID: this.personalInfoFormGroup.value.beneficiaryRegID,
                });
                console.log(this.personalInfoFormGroup.value.parentRegID);
              }
            }
          },
          error => {
            this.confirmationService.alert(error, 'error');
            this.personalInfoFormGroup.patchValue({
              parentRegID: null,
              parentRelation: 1,
              phoneNo: null,
            });
          }
        );
      } else {
        if (this.patientRevisit) {
          this.personalInfoFormGroup.patchValue({
            parentRegID: this._parentBenRegID,
            parentRelation: null,
            phoneNo: null,
          });
        } else {
          this.personalInfoFormGroup.patchValue({
            parentRegID: null,
            parentRelation: null,
            phoneNo: null,
          });
        }
      }
    }
    /**
     *
     * Age Entered in Input
     */
    enableMaritalStatus = false;
    onAgeEntered() {
      const valueEntered = this.personalInfoFormGroup.value.age;
      if (valueEntered) {
        if (
          valueEntered > this.ageLimit &&
          this.personalInfoFormGroup.value.ageUnit === 'Years'
        ) {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.ageRestriction,
            'info'
          );
          this.personalInfoFormGroup.patchValue({ age: null });
        } else {
          console.log(
            moment()
              .subtract(this.personalInfoFormGroup.value.ageUnit, valueEntered)
              .toDate()
          );
          this.personalInfoFormGroup.patchValue({
            dob: moment()
              .subtract(this.personalInfoFormGroup.value.ageUnit, valueEntered)
              .toDate(),
          });
        }
      }
      this.confirmMarriageEligible();
      this.checkAgeAtMarriage();
    }
  
    onAgeUnitEntered() {
      if (this.personalInfoFormGroup.value.age !== null) {
        this.onAgeEntered();
      }
    }
  
    /**
     *
     * Change Age as per changed in Calendar
     */
    dobChangeByCalender(dobval: any) {
      const date = new Date(this.dateForCalendar);
      console.log(' personalInfoFormGroup', this.personalInfoFormGroup.value);
      // console.log(this.dateForCalendar,'fromcalendar');
      // console.log(date,'new')
      if (
        this.dateForCalendar &&
        (!dobval || dobval.length === 10) &&
        this.personalInfoFormGroup.controls['dob'].valid
      ) {
        const dateDiff = Date.now() - date.getTime();
        const age = new Date(dateDiff);
        const yob = Math.abs(age.getFullYear() - 1970);
        const mob = Math.abs(age.getMonth());
        const dob = Math.abs(age.getDate() - 1);
        if (yob > 0) {
          this.personalInfoFormGroup.patchValue({ age: yob });
          this.personalInfoFormGroup.patchValue({ ageUnit: 'Years' });
        } else if (mob > 0) {
          this.personalInfoFormGroup.patchValue({ age: mob });
          this.personalInfoFormGroup.patchValue({ ageUnit: 'Months' });
        } else if (dob > 0) {
          this.personalInfoFormGroup.patchValue({ age: dob });
          this.personalInfoFormGroup.patchValue({ ageUnit: 'Days' });
        }
        if (date.setHours(0, 0, 0, 0) === this.today.setHours(0, 0, 0, 0)) {
          this.personalInfoFormGroup.patchValue({ age: 1 });
          this.personalInfoFormGroup.patchValue({ ageUnit: 'Days' });
        }
  
        this.checkAgeAtMarriage();
        this.confirmMarriageEligible();
      } else if (dobval === 'Invalid date') {
        this.personalInfoFormGroup.patchValue({ dob: null });
        this.dateForCalendar = null;
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.invalidData,
          'info'
        );
      } else {
        this.personalInfoFormGroup.patchValue({ age: null });
      }
    }
    /**
     * Check Marriage Eligibility to enable Field
     *
     */
    confirmMarriageEligible() {
      if (
        this.personalInfoFormGroup.value.age >= this.ageforMarriage &&
        this.personalInfoFormGroup.value.ageUnit === 'Years'
      ) {
        this.enableMaritalStatus = true;
      } else {
        this.enableMaritalStatus = false;
        this.clearMaritalStatus();
      }
    }
  
    /**
     *
     * Clear Marital Status if previously entered
     */
    clearMaritalStatus() {
      if (this.personalInfoFormGroup.value.maritalStatus !== null) {
        this.personalInfoFormGroup.patchValue({
          maritalStatus: null,
          maritalStatusName: null,
        });
        //  this.personalInfoFormGroup.controls['maritalStatus'].setErrors(null);
        //  this.personalInfoFormGroup.controls['maritalStatus'].updateValueAndValidity();
  
        this.enableMarriageDetails = false;
        this.clearMarriageDetails();
      }
    }
  
    /**
     * Income Status Select and get Name
     */
    onIncomeChanged() {
      const incomeMaster = this.masterData.incomeMaster;
      incomeMaster.forEach((element: any, i: any) => {
        if (element.incomeStatusID === this.personalInfoFormGroup.value.income) {
          this.personalInfoFormGroup.patchValue({
            incomeName: element.incomeStatus,
          });
        }
      });
    }
  
    /**
     *
     * Marital Status Changed
     */
    enableMarriageDetails = false;
    enableSpouseMandatory = false;
    onMaritalStatusChanged() {
      if (
        this.personalInfoFormGroup.value.maritalStatus === 1 ||
        this.personalInfoFormGroup.value.maritalStatus === 7
      ) {
        this.enableMarriageDetails = false;
        this.clearMarriageDetails();
      } else {
        this.enableMarriageDetails = true;
      }
      if (this.personalInfoFormGroup.value.maritalStatus === 2) {
        this.enableSpouseMandatory = true;
        this.clearMarriageDetails();
      } else {
        this.enableSpouseMandatory = false;
        this.clearMarriageDetails();
      }
  
      const maritalMaster = this.masterData.maritalStatusMaster;
      maritalMaster.forEach((element: any, i: any) => {
        if (
          element.maritalStatusID === this.personalInfoFormGroup.value.maritalStatus
        ) {
          this.personalInfoFormGroup.patchValue({
            maritalStatusName: element.status,
          });
        }
      });
    }
  
    /**
     * Clear Marriage Details if Entered
     *
     */
    clearMarriageDetails() {
      if (this.personalInfoFormGroup.value.spouseName !== null) {
        this.personalInfoFormGroup.patchValue({ spouseName: null });
      }
      if (this.personalInfoFormGroup.value.ageAtMarriage !== null) {
        this.personalInfoFormGroup.patchValue({ ageAtMarriage: null });
      }
    }
  
    /**
     *
     * check for validity of Age At Marriage with other Details
     */
    checkAgeAtMarriage() {
      if (this.personalInfoFormGroup.value.ageAtMarriage !== null) {
        if (this.personalInfoFormGroup.value.age === null) {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.pleaseenterBeneficiaryagefirst,
            'info'
          );
          this.personalInfoFormGroup.patchValue({ ageAtMarriage: null });
        } else if (this.personalInfoFormGroup.value.ageUnit !== 'Years') {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.marriageAge +
              ' ' +
              this.ageforMarriage +
              ' ' +
              this.currentLanguageSet.alerts.info.years,
            'info'
          );
          this.personalInfoFormGroup.patchValue({ ageAtMarriage: null });
        } else if (this.personalInfoFormGroup.value.age < this.ageforMarriage) {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.marriageAge +
              ' ' +
              this.ageforMarriage +
              ' ' +
              this.currentLanguageSet.alerts.info.years,
            'info'
          );
          this.personalInfoFormGroup.patchValue({ ageAtMarriage: null });
        } else if (
          this.personalInfoFormGroup.value.ageAtMarriage < this.ageforMarriage
        ) {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.marriageAge +
              ' ' +
              this.ageforMarriage +
              ' ' +
              this.currentLanguageSet.alerts.info.years,
            'info'
          );
          this.personalInfoFormGroup.patchValue({ ageAtMarriage: null });
        } else if (
          this.personalInfoFormGroup.value.age -
            this.personalInfoFormGroup.value.ageAtMarriage <
          0
        ) {
          this.confirmationService.alert(
            this.currentLanguageSet.common.marriageatageismorethantheactualage,
            'info'
          );
          this.personalInfoFormGroup.patchValue({ ageAtMarriage: null });
        }
      }
    }
  
    /**
     * Occupation Name when ID is selected
     */
    getOccupationName() {
      this.masterData.occupationMaster.forEach((occupation: any) => {
        if (
          this.personalInfoFormGroup.value.occupation === occupation.occupationID &&
          this.personalInfoFormGroup.value.occupation !== 7
        ) {
          this.personalInfoFormGroup.patchValue({
            occupationOther: occupation.occupationType,
          });
          console.log('reached form');
        }
      });
  
      if (
        !this.personalInfoFormGroup.value.occupationOther ||
        this.personalInfoFormGroup.value.occupation === 7
      ) {
        this.personalInfoFormGroup.patchValue({
          occupationOther: null,
        });
      }
    }
  
    /**
     * Education Qualification when ID is selected
     */
    onEducationQualificationChanged() {
      const qualificationMaster = this.masterData.qualificationMaster;
      qualificationMaster.forEach((element: any, i: any) => {
        if (
          element.educationID ===
          this.personalInfoFormGroup.value.educationQualification
        ) {
          this.personalInfoFormGroup.patchValue({
            educationQualificationName: element.educationType,
          });
        }
      });
    }

      /***
   *
   * Load Editing Data to Form
   */
  pushEditingDatatoForm(element: any) {
    console.log(element, 'datahere');
    this.dateForCalendar = moment(element.dOB).toDate(); //calendar ngModel
    this.personalInfoFormGroup.patchValue({
      beneficiaryID: element.beneficiaryID,
      beneficiaryRegID: element.beneficiaryRegID,
      firstName: element.firstName,
      lastName: element.lastName,
      benAccountID: element.benAccountID,
      phoneNo: this.getPhoneMaps(element.benPhoneMaps),
      parentRegID: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].parentBenRegID) ||
        null
      }`,
      parentRelation: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].benRelationshipID) ||
        null
      }`,
      benPhMapID: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].benPhMapID) ||
        null
      }`,
      benRelationshipType: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].benRelationshipType &&
          element.benPhoneMaps[0].benRelationshipType.benRelationshipType) ||
        null
      }`,
      gender: element.m_gender.genderID,
      genderName: element.m_gender.genderName,
      dob: moment(element.dOB).toDate(),
      maritalStatus:
        (element.maritalStatus && element.maritalStatus.maritalStatusID) ||
        null,
      maritalStatusName: `${
        (element.maritalStatus && element.maritalStatus.status) || null
      }`,
      spouseName: element.spouseName || null,
      ageAtMarriage: element.ageAtMarriage || null,
      // income: element.i_bendemographics && element.i_bendemographics.incomeStatus || null,
      incomeName:
        (element.i_bendemographics && element.i_bendemographics.incomeStatus) ||
        null,
      literacyStatus: element.literacyStatus || null,
      educationQualification:
        (element.i_bendemographics &&
          element.i_bendemographics.i_beneficiaryeducation &&
          element.i_bendemographics.i_beneficiaryeducation.educationID) ||
        null,
      educationQualificationName:
        (element.i_bendemographics &&
          element.i_bendemographics.i_beneficiaryeducation &&
          element.i_bendemographics.i_beneficiaryeducation.educationType) ||
        null,
      occupation:
        (element.i_bendemographics && element.i_bendemographics.occupationID) ||
        null,
      occupationOther:
        (element.i_bendemographics &&
          element.i_bendemographics.occupationName) ||
        null,
      monthlyFamilyIncome: element.monthlyFamilyIncome,
    });
    // this.onMaritalStatusChanged(); // Marital status Changed
    this.masterData.incomeMaster.forEach((stat: any) => {
      if (
        element.i_bendemographics.incomeStatus &&
        stat.incomeStatus === element.i_bendemographics.incomeStatus
      ) {
        this.personalInfoFormGroup.patchValue({
          income: stat.incomeStatusID,
        });
      }
    });
    this.dobChangeByCalender(undefined);

    if (
      element.maritalStatus.maritalStatusID === 1 ||
      element.maritalStatus.maritalStatusID === 7
    ) {
      this.enableMarriageDetails = false;
      this.clearMarriageDetails();
    } else {
      this.enableMarriageDetails = true;
    }

    // console.log(this.personalInfoFormGroup.value ,'personal data updated ')
    this._parentBenRegID = `${
      (element.benPhoneMaps.length > 0 &&
        element.benPhoneMaps[0].parentBenRegID) ||
      null
    }`;
    this.personalInfoFormGroup.patchValue({
      checked: true,
    });
  }

  /**
   *
   * get ben image from api
   */
  getBenImage() {
    this.beneficiaryDetailsService
      .getBeneficiaryImage(this.revisitData.beneficiaryRegID)
      .subscribe((data: any) => {
        console.log(data, 'imagedata');
        if (data && data.benImage) {
          this.personalInfoFormGroup.patchValue({
            image: data.benImage,
          });
        }
      });
  }

  getPhoneMaps(phoneMap: any) {
    if (phoneMap && phoneMap.length && phoneMap.length > 0) {
      return phoneMap[0].phoneNo;
    } else {
      return null;
    }
  }

    ngOnDestroy() {
      if (this.masterDataSubscription) {
        this.masterDataSubscription.unsubscribe();
      }
      if (this.patientRevisit && this.revisitDataSubscription) {
        this.revisitDataSubscription.unsubscribe();
      }
    }
  
}
