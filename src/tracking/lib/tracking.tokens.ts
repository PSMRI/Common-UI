import { InjectionToken } from '@angular/core';
import { TrackingProvider } from './tracking-provider';

export const TRACKING_PLATFORM = new InjectionToken<string>('tracking.platform');
export const MATOMO_SITE_ID = new InjectionToken<number>('matomo.siteId');
export const MATOMO_URL = new InjectionToken<string>('matomo.url');
export const TRACKING_PROVIDER = new InjectionToken<TrackingProvider>('tracking.provider');