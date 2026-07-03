import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RdDeviceService {
  rdURL = '';
  MethodInfo = '/rd/info';
  MethodCapture = '/rd/capture';
  httpStaus: boolean = false;
  capturePID: any;
  pidDetail: any = null;
  pidDetailData = new BehaviorSubject<any>(this.pidDetail);
  pidDetailDetails$ = this.pidDetailData.asObservable();
  pidResponseData: any;

  constructor(private http: HttpClient) {}

  /**
   * Synchronous request to the local RD (Registered Device) service, which uses
   * non-standard HTTP verbs (RDSERVICE / DEVICEINFO / CAPTURE). Mirrors the
   * previous jQuery `$.ajax({ async: false, processData: false })` behaviour with
   * a native XMLHttpRequest (kept synchronous so callers get the response inline).
   */
  private rdRequest(type: string, url: string, data?: string): string {
    const xhr = new XMLHttpRequest();
    xhr.open(type, url, false);
    xhr.setRequestHeader('Content-Type', 'text/xml; charset=utf-8');
    xhr.send(data ?? null);
    if (xhr.status < 200 || xhr.status >= 300) {
      throw new Error(xhr.statusText || 'RD device request failed');
    }
    return xhr.responseText;
  }

  /** Set the value of a (possibly absent) input by id — matches jQuery `$('#id').val(v)`. */
  private setInputValue(id: string, value: string): void {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) {
      el.value = value;
    }
  }

  discoverAvdm(): Observable<any> {
    const primaryUrl =
      window.location.protocol === 'https:'
        ? 'https://127.0.0.1:'
        : 'http://127.0.0.1:';
    const discoveryRange = Array.from({ length: 21 }, (_, i) => i + 11101);
    return new Observable(observer => {
      this.discoverRecursive(observer, primaryUrl, discoveryRange, 0);
    });
  }

  private discoverRecursive(
    observer: any,
    primaryUrl: any,
    discoveryRange: any,
    index: any
  ) {
    if (index >= discoveryRange.length) {
      observer.error('Connection failed. Please try again.');
      observer.complete();
      return;
    }
    const port = discoveryRange[index];
    const url = `${primaryUrl}${port}`;
    this.rdURL = `${primaryUrl}${port}`;

    let data: string;
    try {
      data = this.rdRequest('RDSERVICE', primaryUrl + '11101');
    } catch (thrownError) {
      this.discoverRecursive(observer, primaryUrl, discoveryRange, index + 1);
      return;
    }

    this.httpStaus = true;
    const res = { httpStaus: this.httpStaus, data: data };
    const finalUrl = primaryUrl + '11101';
    const doc = new DOMParser().parseFromString(data, 'text/xml');
    const CmbData1 =
      doc.querySelector('RDService')?.getAttribute('status') || '';
    const CmbData2 = doc.querySelector('RDService')?.getAttribute('info') || '';
    if (RegExp('\\b' + 'Mantra' + '\\b').test(CmbData2) == true) {
      this.setInputValue('txtDeviceInfo', data);
      const interfaces = doc.querySelectorAll('Interface');
      if (interfaces[0]?.getAttribute('path') == '/rd/capture') {
        this.MethodCapture = interfaces[0]?.getAttribute('path') || '';
        console.log(this.MethodCapture);
      }
      if (interfaces[0]?.getAttribute('path') == '/rd/info') {
        this.MethodInfo = interfaces[0]?.getAttribute('path') || '';
        console.log(this.MethodInfo);
      }
      const ddlAVDM = document.getElementById('ddlAVDM');
      if (ddlAVDM) {
        ddlAVDM.insertAdjacentHTML(
          'beforeend',
          '<option value=' +
            '11101' +
            '>(' +
            CmbData1 +
            ')' +
            CmbData2 +
            '</option>'
        );
      }
      observer.next(res);
      observer.complete();
    } else {
      this.discoverRecursive(observer, primaryUrl, discoveryRange, index + 1);
    }
  }

  getDeviceInfo(): Observable<any> {
    const finalUrl = this.rdURL + this.MethodInfo;
    return new Observable(observer => {
      let data: string;
      try {
        data = this.rdRequest('DEVICEINFO', finalUrl);
      } catch (thrownError) {
        observer.error({ httpStaus: this.httpStaus, err: thrownError });
        return;
      }
      this.httpStaus = true;
      const res = { httpStaus: this.httpStaus, data: data };
      console.log(res);
      this.setInputValue('txtDeviceInfo', data);
      observer.next(res);
      observer.complete();
    });
  }

  captureAvdm(): Observable<any> {
    const finalUrl = this.rdURL + this.MethodCapture;
    const requestData =
      '<PidOptions ver="1.0">\r\n<Opts env="P" fCount="1" fType="2" format="0" iType="" pCount="0" pidVer="2.0" posh="UNKNOWN" timeout="20000" wadh="E0jzJ/P8UopUHAieZn8CKqS4WPMi5ZSYXgfnlfkWjrc="/></PidOptions>';
    return new Observable(observer => {
      let data: string;
      try {
        data = this.rdRequest('CAPTURE', finalUrl, requestData);
      } catch (thrownError) {
        observer.error({ httpStaus: this.httpStaus, err: thrownError });
        return;
      }
      this.httpStaus = true;
      const res = { httpStaus: this.httpStaus, data: data };
      console.log('unecripted data - ', data);
      const encodedPIDRes = btoa(data);
      console.log('encrypted data', encodedPIDRes);
      this.setInputValue('txtPidData', encodedPIDRes);
      this.setInputValue('txtPidOptions', encodedPIDRes);
      this.getpidDetail(encodedPIDRes);
      observer.next(encodedPIDRes);
      observer.complete();
    });
  }

  getpidDetail(pidDetailDetails: any) {
    this.pidDetail = pidDetailDetails;
    this.pidDetailData.next(this.pidDetail);
  }
}
