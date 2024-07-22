import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrarService } from '../../services/registrar.service';
import { MatDialog } from '@angular/material/dialog';
import { HealthIdDisplayModalComponent } from '../../health-id-display-modal/health-id-display-modal.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { HealthIdValidateComponent } from '../../health-id-validatepopup/health-id-validatepopup.component';
import { FormGroup } from '@angular/forms';
import { GenerateAbhaComponentComponent } from '../../generate-abha-component/generate-abha-component.component';

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

  @Input()
  abhaInfoFormGroup: any;

  currentLanguageSet: any
  disableGenerateOTP = false;
  genrateHealthIDCard = true;

  constructor(
    private router: Router,
    private registrarService: RegistrarService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private languageComponent: SetLanguageComponent
  ){}

  ngOnIt(){
    this.fetchLanguageResponse();

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
