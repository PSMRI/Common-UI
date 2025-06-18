import { Injectable, Inject } from '@angular/core';
import { TrackingProvider } from './tracking-provider';
import { MATOMO_SITE_ID, MATOMO_URL } from './tracking.tokens';

// Initialise global queue if Matomo script not yet loaded
const _w = window as any;
_w._paq = _w._paq || [];
const _paq: any[] = _w._paq;

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
    const args: (string | number)[] = ['trackEvent', category, action];
    if (label) { args.push(label); }
    if (value !== undefined) { args.push(value); }
    _paq.push(args);
  }
}