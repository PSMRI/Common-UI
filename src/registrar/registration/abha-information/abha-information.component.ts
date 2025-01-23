import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrarService } from '../../services/registrar.service';
import { MatDialog } from '@angular/material/dialog';
import { HealthIdDisplayModalComponent } from '../../abha-components/health-id-display-modal/health-id-display-modal.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GenerateAbhaComponentComponent } from '../../abha-components/generate-abha-component/generate-abha-component.component';
import { DownloadSearchAbhaComponent } from '../../abha-components/download-search-abha/download-search-abha.component';

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
  ) {
    this.abhaInfoSubscription =
      this.registrarService.registrationABHADetails$.subscribe(
        (response: any) => {
          console.log('responseABHACompoenet', response);
          if (response) {
            this.abhaInfoFormGroup.patchValue({
              healthIdNumber: response.healthIdNumber,
            });
            this.abhaInfoFormGroup.controls['healthIdNumber'].disable();
          }
        },
      );
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
        if (item.isEditable === false) {
          this.abhaInfoFormGroup.get(item.fieldName)?.disable();
        } else {
          this.abhaInfoFormGroup.get(item.fieldName)?.enable();
        }
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

  onInputChanged(event: Event, maxLength: any, fieldName: any) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = inputElement.value;

    if (maxLength && inputValue.length >= parseInt(maxLength)) {
      // Add 'A' character when the input length exceeds the limit
      inputElement.value = inputValue.slice(0, maxLength);
      this.abhaInfoFormGroup.controls[fieldName].patchValue(inputElement.value);
      const currentErrors = this.abhaInfoFormGroup.controls[fieldName].errors;
      if (currentErrors && currentErrors['maxlength']) {
        delete currentErrors['maxlength'];
      }
    }
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
        break;
    }

    return regex;
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
    const dialogRef = this.dialog.open(DownloadSearchAbhaComponent, {
      height: '330px',
      width: '500px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.clearHealthID === true) {
            this.abhaInfoFormGroup.controls['healthId'].patchValue(null);
            this.abhaInfoFormGroup.controls['healthIdMode'].patchValue(null);
        } else {
            this.abhaInfoFormGroup.patchValue({ healthId: result.healthIdNumber });
            this.abhaInfoFormGroup.patchValue({ healthIdMode: result.healthIdMode });
            this.abhaInfoFormGroup.controls['healthIdNumber'].disable();
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
