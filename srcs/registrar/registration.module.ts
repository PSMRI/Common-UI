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
import { SharedModule } from 'src/app/app-modules/core/shared/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchDialogComponent } from './search-dialog/search-dialog.component';
import { SearchComponent } from './search/search.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';


@NgModule({
  declarations: [
    PersonalInformationComponent,
    LocationInformationComponent,
    OtherInformationComponent,
    AbhaInformationComponent,
    DashboardComponent,
    RegistrationComponent,
    SearchComponent,
    SearchDialogComponent
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
    SearchDialogComponent
  ]
})
export class RegistrationModule { }
