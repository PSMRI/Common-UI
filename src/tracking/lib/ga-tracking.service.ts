import { Injectable } from '@angular/core';
import { TrackingProvider } from './tracking-provider';

@Injectable()
export class GATrackingService implements TrackingProvider {
  init(siteId?: number, trackerUrl?: string) {
    console.warn('GA init stub called');
  }
  setUserId(userId: string) {
    console.warn('GA setUserId stub called');
  }
  pageView(path: string) {
    console.warn(`GA pageView stub: ${path}`);
  }
  event(category: string, action: string, label?: string, value?: number) {
    console.warn(`GA event stub: ${category}, ${action}, ${label}, ${value}`);
  }
}