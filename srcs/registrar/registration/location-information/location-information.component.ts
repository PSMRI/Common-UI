import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { RegistrarService } from '../../services/registrar.service';

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
  locationDetails: any;
  demographicsMaster: any;
  villgeBranch: any;
  suggestedvillageList: any;
  subDistrictList: any =[];
  statesList: any;
  zonesList: any =[];
  parkingPlaceList: any = [];
  districtList: any = [];
  villageList: any;
  servicePointList: any=[];


  constructor(
    private fb: FormBuilder,
    private registrarService: RegistrarService
  ){}

  ngOnInit(){
    this.formData.forEach((item: any) => {
      if(item.fieldName)
      this.locationInfoFormGroup.addControl(item.fieldName, new FormControl());
    });
    this.locationInfoFormGroup.addControl('stateID', new FormControl());
    this.locationInfoFormGroup.addControl('districtID', new FormControl());
    this.locationInfoFormGroup.addControl('blockID', new FormControl());
    this.locationInfoFormGroup.addControl('districtBranchID', new FormControl());
    this.locationInfoFormGroup.addControl('zoneID', new FormControl());
    this.locationInfoFormGroup.addControl('parkingPlaceID', new FormControl());
    this.locationInfoFormGroup.addControl('servicePointID', new FormControl());
    console.log("location Data", this.locationInfoFormGroup);

    let locationData: any = localStorage.getItem('locationData');
    this.locationDetails = JSON.parse(locationData);
    this.loadLocationFromStorage();
    this.loadLocalMasterForDemographic();
    // this.patchLocationDetails();
  }

  // patchLocationDetails(){
  //   this.locationInfoFormGroup.get('stateID')?.patchValue(this.locationDetails.stateID);
  //   this.locationInfoFormGroup.get('stateNmae')?.patchValue(this.locationDetails.stateID);
  //   this.locationInfoFormGroup.get('districtID')?.patchValue(this.locationDetails.districtID);
  //   this.locationInfoFormGroup.get('districtName')?.patchValue(this.locationDetails.districtName);
  //   this.locationInfoFormGroup.get('blockID')?.patchValue(this.locationDetails.blockID);
  //   this.locationInfoFormGroup.get('blockName')?.patchValue(this.locationDetails.blockName);
  //   this.locationInfoFormGroup.get('districtBranchID')?.patchValue(this.locationDetails.subDistrictID);
  //   this.locationInfoFormGroup.get('districtBranchName')?.patchValue(this.locationDetails.villageName);
  // }

  loadLocationFromStorage() {
    const locationData: any = localStorage.getItem('location');
    const location = JSON.parse(locationData);
    this.demographicsMaster = Object.assign({}, location, {
      servicePointID: localStorage.getItem('servicePointID'),
      servicePointName: localStorage.getItem('servicePointName'),
    });

    if (
      this.demographicsMaster.otherLoc &&
      this.demographicsMaster.stateMaster &&
      this.demographicsMaster.stateMaster.length >= 1 &&
      this.demographicsMaster.servicePointID &&
      this.demographicsMaster.servicePointName
    ) {
      this.loadLocalMasterForDemographic();
    } else if (
      this.demographicsMaster.stateMaster &&
      this.demographicsMaster.stateMaster.length >= 1
    ) {
      this.statesList = this.demographicsMaster.stateMaster;
      this.loadServicePoint();
    }
  }

  // Calling all data masters separately
  loadLocalMasterForDemographic() {
      this.loadState();
      // this.loadDistrict();
      // this.loadSubDistrict();
      // this.loadVillage();
      // this.loadZone();
      // this.loadParkingPlace();
      // this.loadServicePoint();
  }

  /**
   * Load States  for New Patient
   */
  loadState() {
    this.statesList = this.demographicsMaster.stateMaster;
    let stateList: any = [];
    this.statesList.forEach((item: any) => stateList.push(item.stateName))
    this.formData.forEach((element: any) => {
      if(element.fieldName === "stateName")
      element.options = stateList
    });
    this.locationInfoFormGroup.patchValue({
      stateID: this.locationDetails.stateID,
      stateName: this.locationDetails.stateName,
    });
    this.locationInfoFormGroup.get('stateName')?.disable();
    this.loadDistrict();
  }

  loadDistrict() {
    let districtList: any = []
      this.registrarService
        .getDistrictList(this.locationInfoFormGroup.value.stateID)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.districtList = res.data;
            this.districtList.forEach((item: any) => districtList.push(item.districtName))
          }
          this.formData.forEach((element: any) => {
            if(element.fieldName === "districtName")
            element.options = districtList;
          });
              
          this.locationInfoFormGroup.patchValue({
            districtID: this.locationDetails.districtID,
            districtName: this.locationDetails.districtName,
      });
      this.locationInfoFormGroup.get('districtName')?.disable();
      this.loadSubDistrict();
        });
}

  /**
   * Load Sub Districts  for New Patient
   */
  loadSubDistrict() {
    let subDistrictList: any = [];
    this.registrarService
    .getSubDistrictList(this.locationInfoFormGroup.value.districtID)
    .subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.subDistrictList = res.data;            
        this.subDistrictList.forEach((item: any) => subDistrictList.push(item.blockName))
      }
      this.formData.forEach((element: any) => {
        if(element.fieldName === "blockName")
        element.options = subDistrictList;
      });
        this.subDistrictList = [
          {
            blockID: this.locationDetails.blockID,
            blockName: this.locationDetails.blockName,
          },
        ];
        this.locationInfoFormGroup.patchValue({
          blockID: this.locationDetails.blockID,
          blockName: this.locationDetails.blockName,
            })
        this.locationInfoFormGroup.get('blockName')?.disable();
        this.loadVillage();
  });
  }

  loadVillage() {
    let villageList: any = [];
    this.registrarService
    .getVillageList(this.locationInfoFormGroup.value.blockID)
    .subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.villageList = res.data;
      }
      this.villageList.forEach((item: any) => villageList.push(item.villageName))
      this.formData.forEach((element: any) => {
        if(element.fieldName === "districtBranchName")
        element.options = villageList;
      });
        this.locationInfoFormGroup.patchValue({
          districtBranchID: this.locationDetails.subDistrictID,
          districtBranchName: this.locationDetails.villageName,
      });
      this.loadZone();
    });
    // this.villageList = this.demographicsMaster.villageMaster;
  }

  /**
   * Load Zones  for New Patient
   */
  loadZone() {
    this.zonesList = [
      {
        zoneID: this.demographicsMaster.otherLoc.zoneID,
        zoneName: this.demographicsMaster.otherLoc.zoneName,
      },
    ];
    let zoneList: any = []
    zoneList.push( this.demographicsMaster.otherLoc.zoneName);
    this.formData.forEach((item: any) => {
      if(item.fieldName === 'zoneName')
      item.options = zoneList
    });
    console.log(this.demographicsMaster.otherLoc, 'zoneLocs------mm-------');
    this.locationInfoFormGroup.patchValue({
      zoneID: this.demographicsMaster.otherLoc.zoneID,
      zoneName: this.demographicsMaster.otherLoc.zoneName,
    });
    this.loadParkingPlace();
  }
  /**
   * Load Parking Place  for New Patient
   */
  loadParkingPlace() {
    this.parkingPlaceList = [
      {
        parkingPlaceID: this.demographicsMaster.otherLoc.parkingPlaceID,
        parkingPlaceName: this.demographicsMaster.otherLoc.parkingPlaceName,
      },
    ];
    let parkingPlaceList: any = []
    parkingPlaceList.push( this.demographicsMaster.otherLoc.parkingPlaceName);
    this.formData.forEach((item: any) => {
      if(item.fieldName === 'parkingPlaceName')
      item.options = parkingPlaceList
    });
    this.locationInfoFormGroup.patchValue({
      parkingPlace: this.demographicsMaster.otherLoc.parkingPlaceID,
      parkingPlaceName: this.demographicsMaster.otherLoc.parkingPlaceName,
    });
    this.loadServicePoint();
  }
  /**
   * Load Service  for New Patient
   */
  loadServicePoint() {
    this.servicePointList = [
      {
        servicePointID: this.demographicsMaster.servicePointID,
        servicePointName: this.demographicsMaster.servicePointName,
      },
    ];
    let servicePointList: any = []
    servicePointList.push( this.demographicsMaster.servicePointName);
    this.formData.forEach((item: any) => {
      if(item.fieldName === 'servicePointName')
      item.options = servicePointList
    });
    this.locationInfoFormGroup.patchValue({
      servicePoint: this.demographicsMaster.servicePointID,
      servicePointName: this.demographicsMaster.servicePointName,
    });
  }

}
