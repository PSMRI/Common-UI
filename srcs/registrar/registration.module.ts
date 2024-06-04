import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistrationRoutingModule } from './registration-routing.module';
import { PersonalInformationComponent } from './registration/personal-information/personal-information.component';
import { LocationInformationComponent } from './registration/location-information/location-information.component';
import { OtherInformationComponent } from './registration/other-information/other-information.component';
import { AbhaInformationComponent } from './registration/abha-information/abha-information.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RegistrationComponent } from './registration/registration.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchDialogComponent } from './search-dialog/search-dialog.component';
import { SearchComponent } from './search/search.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SharedModule } from 'src/app/app-modules/core/components/shared/shared.module';
import { RegistrarService } from './services/registrar.service';
import { RegistrationService } from './services/registration.service';
import { BiometricAuthenticationComponent } from './biometric-authentication/biometric-authentication.component';
import { FamilyTaggingDetailsComponent } from './family-tagging/family-tagging-details/family-tagging-details.component';
import { CreateFamilyTaggingComponent } from './family-tagging/create-family-tagging/create-family-tagging.component';
import { EditFamilyTaggingComponent } from './family-tagging/edit-family-tagging/edit-family-tagging.component';
import { GenerateAbhaComponentComponent } from './generate-abha-component/generate-abha-component.component';
import { GenerateMobileOtpGenerationComponent } from './generate-mobile-otp-generation/generate-mobile-otp-generation.component';
import { HealthIdDisplayModalComponent } from './health-id-display-modal/health-id-display-modal.component';
import { HealthIdOtpGenerationComponent } from './health-id-otp-generation/health-id-otp-generation.component';
import { ViewHealthIdCardComponent } from './view-health-id-card/view-health-id-card.component';
import { SearchFamilyComponent } from './search-family/search-family.component';
import { BeneficiaryDetailsComponent } from './beneficiary-details/beneficiary-details.component';
import { HealthIdValidateComponent } from './health-id-validatepopup/health-id-validatepopup.component';


@NgModule({
  declarations: [
    PersonalInformationComponent,
    LocationInformationComponent,
    OtherInformationComponent,
    AbhaInformationComponent,
    DashboardComponent,
    RegistrationComponent,
    SearchComponent,
    SearchDialogComponent,
    BiometricAuthenticationComponent,
    FamilyTaggingDetailsComponent,
    CreateFamilyTaggingComponent,
    EditFamilyTaggingComponent,
    GenerateAbhaComponentComponent,
    GenerateMobileOtpGenerationComponent,
    HealthIdDisplayModalComponent,
    HealthIdOtpGenerationComponent,
    ViewHealthIdCardComponent,
    SearchFamilyComponent,
    BeneficiaryDetailsComponent,
    HealthIdValidateComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    MatStepperModule,
    ReactiveFormsModule,
    FormsModule,
    RegistrationRoutingModule,
    SharedModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [
    PersonalInformationComponent,
    LocationInformationComponent,
    OtherInformationComponent,
    AbhaInformationComponent,
    RegistrationComponent,
    SearchComponent,
    SearchDialogComponent,
    BiometricAuthenticationComponent,
    FamilyTaggingDetailsComponent,
    CreateFamilyTaggingComponent,
    EditFamilyTaggingComponent,
    GenerateAbhaComponentComponent,
    GenerateMobileOtpGenerationComponent,
    HealthIdDisplayModalComponent,
    HealthIdOtpGenerationComponent,
    BeneficiaryDetailsComponent,
    HealthIdValidateComponent
  ],
  providers: [
    RegistrarService,
    RegistrationService
  ]
})
export class RegistrationModule { }
