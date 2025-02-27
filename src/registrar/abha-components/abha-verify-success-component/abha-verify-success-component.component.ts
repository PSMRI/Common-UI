import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../services/registrar.service';
import { DisplayAbhaCardComponent } from '../display-abha-card/display-abha-card.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';

@Component({
  selector: 'app-abha-verify-success-component',
  templateUrl: './abha-verify-success-component.component.html',
  styleUrls: ['./abha-verify-success-component.component.css']
})
export class AbhaVerifySuccessComponentComponent {

  currentLanguageSet: any;
  showProgressBar = false;

  constructor(
    public dialogSucRef: MatDialogRef<AbhaVerifySuccessComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService
  ) { }

  abhaDetails: any;
  xToken: any;

  ngOnInit() {
    this.assignSelectedLanguage();
    if(this.data.abhaResponse){
      this.abhaDetails = this.data.abhaResponse;
    }
    if(this.data.xToken){
      this.xToken = this.data.xToken;
    }
  }

  closeDialog() {
    this.dialogSucRef.close(true);
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
    this.dialogSucRef.close(true);
    let png = null;
    this.showProgressBar = true;
    let reqObj = {
      xToken: this.data.xToken
    }
    this.registrarService.printPngCard(reqObj, this.data.loginHint).subscribe((res: any) => {
      if(res.statusCode === 200 && res.data){
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
      height: 'auto',
      width: 'auto',
      data: {png: png}
    });
  }

}
