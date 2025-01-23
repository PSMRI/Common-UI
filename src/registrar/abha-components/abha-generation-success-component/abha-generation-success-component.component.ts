import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { AbhaEnterOtpComponentComponent } from '../abha-enter-otp-component/abha-enter-otp-component.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { DisplayAbhaCardComponent } from '../display-abha-card/display-abha-card.component';
import { AbhaEnterMobileOtpComponentComponent } from '../abha-enter-mobile-otp-component/abha-enter-mobile-otp-component.component';

@Component({
  selector: 'app-abha-generation-success-component',
  templateUrl: './abha-generation-success-component.component.html',
  styleUrls: ['./abha-generation-success-component.component.css']
})
export class AbhaGenerationSuccessComponentComponent {

  currentLanguageSet: any;
  enableMobileOtpMessage = false;
  abhaProfileData: any;
  verify = false;
  genderName: any;
  showProgressBar= false;
  mobileNumber: any;

  constructor(
    public dialogSucRef: MatDialogRef<AbhaGenerationSuccessComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService
  ) { }

  succdata: any = this.data;
  txnId: any = this.data.txnId;
  xToken = this.data.xToken;

  ngOnInit() {
    this.assignSelectedLanguage();
    console.log("success generation popup data -", this.succdata)
    if (this.succdata.newAbhaResponse) {
      this.abhaProfileData = this.succdata.newAbhaResponse;      
      if (this.abhaProfileData?.ABHAProfile?.mobile !== null && this.abhaProfileData?.ABHAProfile?.mobile !== undefined) {
        this.enableMobileOtpMessage = false;
      } else {
        this.mobileNumber = this.succdata.mobileNumber;
        this.txnId = this.abhaProfileData.txnId
        this.enableMobileOtpMessage = true;
      }
    }
    if (this.succdata.Auth) {
      if (
        this.succdata.Auth.Patient !== undefined &&
        this.succdata.Auth.Patient !== null
      )
        this.verify = true;
      if (
        this.succdata.Auth.Patient.Gender !== undefined &&
        this.succdata.Auth.Patient.Gender !== null
      ) {
        this.genderName =
          this.succdata.Auth.Patient.Gender === '0'
            ? 'Male'
            : this.succdata.Auth.Patient.Gender === '1'
              ? 'Female'
              : this.succdata.Auth.Patient.Gender === '2'
                ? 'Transgender'
                : 'Transgender';
      }
    }
  }

  GivePageToMobileEnterOtp(){
    this.dialogSucRef.close();
    let dialogRef = this.dialog.open(AbhaEnterMobileOtpComponentComponent, {
      height: '250px',
      width: '420px',
      data: {txnId: this.txnId, mobileNumber: this.mobileNumber }
    });
    // dialogRef.close();
  }

  closeSuccessDialog() {
    this.dialogSucRef.close();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  downloadPngCard(){
    this.dialogSucRef.close();
    let png = null;
    this.showProgressBar = true;
    let reqObj = {
      xToken: this.xToken
    }
    this.registrarService.printPngCard(reqObj).subscribe((res: any) => {
      this.showProgressBar = false;
      if(res.statusCode === 200 && res.data){
        console.log("png API response -", res.data)
        png = res.data.png;
        this.displayAbhaCard(png);
      } else {
        this.confirmationService.alert(this.currentLanguageSet.issueInAbhaCard, 'error');
      }
    }, (err: any) => {
      this.confirmationService.alert(err.errorMessage, 'error');
    });
  }

  displayAbhaCard(png: any){
    let matDialogRef = this.dialog.open(DisplayAbhaCardComponent, {
      height: "auto",
      width: "auto",
      disableClose: true,
      data: {png: png}
    });
  }
}
