import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as $ from 'jquery';

@Injectable({ providedIn: 'root' })
export class RdDeviceService {
  rdURL='';
  MethodInfo='/rd/info';
  MethodCapture = '/rd/capture';
  httpStaus: boolean = false;
  capturePID: any;
  pidDetail: any= null ;
  pidDetailData = new BehaviorSubject<any>(this.pidDetail);
  pidDetailDetails$ = this.pidDetailData.asObservable();
  pidResponseData: any;

  constructor(private http: HttpClient) {}
  discoverAvdm(): Observable<any> {
    const primaryUrl =
      window.location.protocol === 'https:'
        ? 'https://127.0.0.1:'
        : 'http://127.0.0.1:';
    const discoveryRange = Array.from({ length: 21 }, (_, i) => i + 11101);
    return new Observable((observer) => {
      this.discoverRecursive(observer, primaryUrl, discoveryRange, 0);
    });
  }
  private discoverRecursive(observer: any, primaryUrl: any, discoveryRange: any, index: any) {
    if (index >= discoveryRange.length) {
      observer.error('Connection failed. Please try again.');
      observer.complete();
      return;
    }
    const port = discoveryRange[index];
    const url = `${primaryUrl}${port}`;
    this.rdURL = `${primaryUrl}${port}`;

    $.ajax({
      type: 'RDSERVICE',
      async: false,
      crossDomain: true,
      url: primaryUrl + '11101',
      contentType: 'text/xml; charset=utf-8',
      processData: false,
      cache: false,
      success: (data: any) => {
        this.httpStaus = true;
        const res = { httpStaus: this.httpStaus, data: data };
        const finalUrl = primaryUrl + '11101';
        const $doc = $.parseXML(data);
        const CmbData1 = $($doc).find('RDService').attr('status') || '';
        const CmbData2 = $($doc).find('RDService').attr('info')|| '';
        if (RegExp('\\b' + 'Mantra' + '\\b').test(CmbData2) == true) {
          $('#txtDeviceInfo').val(data);
          if ($($doc).find('Interface').eq(0).attr('path') == '/rd/capture') {
            this.MethodCapture = $($doc).find('Interface').eq(0).attr('path') || '';
            console.log(this.MethodCapture);
          }
          if ($($doc).find('Interface').eq(0).attr('path') == '/rd/info') {
            this.MethodInfo = $($doc).find('Interface').eq(0).attr('path') || ''
            ;
            console.log(this.MethodInfo);
          }
          $('#ddlAVDM').append(
            '<option value=' +
              '11101' +
              '>(' +
              CmbData1 +
              ')' +
              CmbData2 +
              '</option>',
          );
          observer.next(res);
          observer.complete();
        } else {
          this.discoverRecursive(
            observer,
            primaryUrl,
            discoveryRange,
            index + 1,
          );
        }
      },
      error: (jqXHR: any, ajaxOptions: any, thrownError: any) => {
        this.discoverRecursive(observer, primaryUrl, discoveryRange, index + 1);
      },
    });
  }
  getDeviceInfo(): Observable<any> {
    const finalUrl = this.rdURL + this.MethodInfo;
    return new Observable((observer) => {
      $.ajax({
        type: 'DEVICEINFO',
        async: false,
        crossDomain: true,
        url: finalUrl,
        contentType: 'text/xml; charset=utf-8',
        processData: false,
        success: (data: any) => {
          this.httpStaus = true;
          const res = { httpStaus: this.httpStaus, data: data };
          console.log(res);
          $('#txtDeviceInfo').val(data);
          observer.next(res);
          observer.complete();
        },
        error: (jqXHR: any, ajaxOptions: any, thrownError: any) => {
          const res = { httpStaus: this.httpStaus, err: thrownError };
          observer.error(res);
        },
      });
    });
  }
  captureAvdm(): Observable<any> {
    const finalUrl = this.rdURL + this.MethodCapture;
    const requestData =
      '<PidOptions ver="1.0">\r\n<Opts env="P" fCount="1" fType="2" format="0" iType="" pCount="0" pidVer="2.0" posh="UNKNOWN" timeout="20000" wadh="E0jzJ/P8UopUHAieZn8CKqS4WPMi5ZSYXgfnlfkWjrc="/></PidOptions>';
    return new Observable((observer) => {
      $.ajax({
        type: 'CAPTURE',
        async: false,
        crossDomain: true,
        url: finalUrl,
        data: requestData,
        contentType: 'text/xml; charset=utf-8',
        processData: false,
        success: (data: any) => {
          this.httpStaus = true;
          const res = { httpStaus: this.httpStaus, data: data };
          console.log("unecripted data - ", data)
          const encodedPIDRes = btoa(data);
          console.log("encrypted data", encodedPIDRes);
          $('#txtPidData').val(encodedPIDRes);
          $('#txtPidOptions').val(encodedPIDRes);
          this.getpidDetail(encodedPIDRes);
          observer.next(encodedPIDRes);
          observer.complete();
        },
        error: (jqXHR: any, ajaxOptions: any, thrownError: any) => {
          const res = { httpStaus: this.httpStaus, err: thrownError };
          observer.error(res);
        },
      });
    });
  }
  getpidDetail(pidDetailDetails: any) {
    this.pidDetail = pidDetailDetails;
    this.pidDetailData.next(this.pidDetail);
  }
}
