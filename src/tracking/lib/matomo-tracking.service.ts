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

    // Error handling for undefined or invalid values
    if (!finalSiteId || typeof finalSiteId !== 'number') {
      console.error('MatomoTrackingService: Invalid or undefined siteId');
      return;
    }

    if (!finalTrackerUrl || typeof finalTrackerUrl !== 'string') {
      console.error('MatomoTrackingService: Invalid or undefined trackerUrl');
      return;
    }

    // Initialize Matomo tracker
    _paq.push(['setTrackerUrl', finalTrackerUrl + 'matomo.php']);
    _paq.push(['setSiteId', finalSiteId]);
  }

  setUserId(userId: string) {
    if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
      console.error('MatomoTrackingService: Invalid or undefined userId');
      return;
    }
    _paq.push(['setUserId', userId]);
  }

  pageView(path: string) {
    if (!path || typeof path !== 'string') {
      console.error('MatomoTrackingService: Invalid or undefined path');
      return;
    }
    _paq.push(['setCustomUrl', path]);
    _paq.push(['trackPageView']);
  }

  event(category: string, action: string, label?: string, value?: number) {
    if (!category || typeof category !== 'string') {
      console.error('MatomoTrackingService: Invalid or undefined category');
      return;
    }

    if (!action || typeof action !== 'string') {
      console.error('MatomoTrackingService: Invalid or undefined action');
      return;
    }

    const args: (string | number)[] = ['trackEvent', category, action];
    if (label && typeof label === 'string') {
      args.push(label);
    }
    if (value !== undefined && typeof value === 'number') {
      args.push(value);
    }

    _paq.push(args);
  }
}