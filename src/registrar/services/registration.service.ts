import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  constructor(
    private http: HttpClient
  ) { }

  fetchAllRegistrationData(reqObj: any){
    return this.http.post(environment.getAllRegistrationData, reqObj);
  }
}
