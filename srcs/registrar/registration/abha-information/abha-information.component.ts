import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrarService } from '../../services/registrar.service';
import { MatDialog } from '@angular/material/dialog';
import { HealthIdDisplayModalComponent } from '../../health-id-display-modal/health-id-display-modal.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { HealthIdValidateComponent } from '../../health-id-validatepopup/health-id-validatepopup.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GenerateAbhaComponentComponent } from '../../generate-abha-component/generate-abha-component.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-abha-information',
  templateUrl: './abha-information.component.html',
  styleUrls: ['./abha-information.component.css']
})
export class AbhaInformationComponent {

  @Input()
  patientRevisit = false;

  @Input()
  revisitData: any;

  @Input('abhaInfoFormGroup')
  abhaInfoFormGroup!: FormGroup;

  @Input('formData')
  formData: any;

  currentLanguageSet: any
  disableGenerateOTP = false;
  genrateHealthIDCard = true;
  abhaInfoSubscription!: Subscription;

  constructor(
    private router: Router,
    private registrarService: RegistrarService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private languageComponent: SetLanguageComponent
  ){
    this.abhaInfoSubscription =
    this.registrarService.registrationABHADetails$.subscribe((response: any) => {
      console.log("responseABHACompoenet", response);
      this.abhaInfoFormGroup.patchValue({
        abha: response.healthIdNumber,
      });
    });
  }

  ngOnInit(){
    console.log("INSIDE ABHA COMPOENENT")
    this.fetchLanguageResponse();
    this.formData.forEach((item: any) => {
      if (item.fieldName && item.allowText) {
        this.abhaInfoFormGroup.addControl(
          item.fieldName,
          new FormControl(null, [
            Validators.pattern(this.allowTextValidator(item.allowText)),
            Validators.minLength(parseInt(item?.allowMin)),
            Validators.maxLength(parseInt(item?.allowMax)),
          ])
        );
      } else {
        this.abhaInfoFormGroup.addControl(
          item.fieldName,
          new FormControl(null)
        );
      }
    });
    console.log("formDataABHA",this.formData);
    console.log('abhaInfoFormGroup Data', this.abhaInfoFormGroup);
    if (this.patientRevisit){
      this.abhaInfoFormGroup.patchValue(this.revisitData);
    console.log('other Form Data', this.formData);
    }
  }

  viewHealthIdData() {
    const reqObj = {
      beneficiaryRegID: this.revisitData.beneficiaryRegID,
      beneficiaryID: this.revisitData.beneficiaryID,
    };
    this.registrarService.getHealthIdDetails(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.dialog.open(HealthIdDisplayModalComponent, {
            data: { dataList: res },
          });
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }

  onInputChanged(event: Event, maxLength: any) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value;

    if (maxLength && inputValue.length >= parseInt(maxLength)) {
      // Add 'A' character when the input length exceeds the limit
      inputElement.value = inputValue.slice(0, maxLength);
    }
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


  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }

  disableGenerateHealthID() {
    this.disableGenerateOTP = true;
  }

  healthIdSearch() {
    const dialogRef = this.dialog.open(HealthIdValidateComponent, {
      height: '400px',
      width: '450px',
      disableClose: true,
      data: {
        healthId: 'NO',
        generateHealthIDCard: this.genrateHealthIDCard,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.clearHealthID === true) {
            this.abhaInfoFormGroup.controls['healthId'].patchValue(null);
            this.abhaInfoFormGroup.controls['healthIdMode'].patchValue(null);
        } else {
            this.abhaInfoFormGroup.patchValue({ healthId: result.healthIdNumber });
            this.abhaInfoFormGroup.patchValue({ healthIdMode: result.healthIdMode });
            this.abhaInfoFormGroup.controls['healthId'].disable();
            this.abhaInfoFormGroup.markAsDirty();
          this.registrarService.changePersonalDetailsData(result);
          this.disableGenerateOTP = true;
        }
      }
    });
  }

  printHealthIDCard() {
    this.genrateHealthIDCard = true;
    this.healthIdSearch();
  }

  generateAbhaCard() {
    this.dialog.open(GenerateAbhaComponentComponent, {
      height: '290px',
      width: '470px',
      disableClose: true,
    });
  }

}
