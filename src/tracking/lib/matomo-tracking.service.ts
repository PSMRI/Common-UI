import { Injectable, Inject } from '@angular/core';
import { TrackingProvider } from './tracking-provider';
import { MATOMO_SITE_ID, MATOMO_URL } from './tracking.tokens';

declare const _paq: any[];

@Injectable()
export class MatomoTrackingService implements TrackingProvider {
  constructor(
    @Inject(MATOMO_SITE_ID) private siteId: number,
    @Inject(MATOMO_URL) private trackerUrl: string
  ) {}

  init(siteId?: number, trackerUrl?: string) {
    const finalSiteId = siteId || this.siteId;
    const finalTrackerUrl = trackerUrl || this.trackerUrl;
    
    // Initialize Matomo tracker
    _paq.push(['setTrackerUrl', finalTrackerUrl + 'matomo.php']);
    _paq.push(['setSiteId', finalSiteId]);
  }

  setUserId(userId: string) {
    _paq.push(['setUserId', userId]);
  }

  pageView(path: string) {
    _paq.push(['setCustomUrl', path]);
    _paq.push(['trackPageView']);
  }

  event(category: string, action: string, label?: string, value?: number) {
    _paq.push(['trackEvent', category, action, label || '', value || 0]);
  }
}