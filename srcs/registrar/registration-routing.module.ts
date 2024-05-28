import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanDeactivateGuardService } from 'src/app/app-modules/core/services/can-deactivate-guard.service';
import { RegistrationComponent } from './registration/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SearchComponent } from './search/search.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full',
      },
      {
        path: 'search',
        component: SearchComponent,
      },
  {
    path: 'registration',
    component: RegistrationComponent,
    canDeactivate: [CanDeactivateGuardService],
  },
  {
    path: 'search/:beneficiaryID',
    component: RegistrationComponent,
  },
]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistrationRoutingModule { }
