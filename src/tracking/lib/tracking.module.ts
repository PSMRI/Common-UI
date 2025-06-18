import { NgModule, ModuleWithProviders, Injector } from '@angular/core';
import { TrackingProvider } from './tracking-provider';
import { MatomoTrackingService } from './matomo-tracking.service';
import { GATrackingService } from './ga-tracking.service';
import { AmritTrackingService } from './amrit-tracking.service';
import { TRACKING_PLATFORM, MATOMO_SITE_ID, MATOMO_URL, TRACKING_PROVIDER } from './tracking.tokens';

export interface TrackingConfig {
  platform: 'matomo' | 'ga';
  matomoSiteId?: number;
  matomoUrl?: string;
}

@NgModule({})
export class TrackingModule {
  static forRoot(config: TrackingConfig): ModuleWithProviders<TrackingModule> {
    return {
      ngModule: TrackingModule,
      providers: [
        { provide: TRACKING_PLATFORM, useValue: config.platform },
        { provide: MATOMO_SITE_ID, useValue: config.matomoSiteId },
        { provide: MATOMO_URL, useValue: config.matomoUrl },
        {
          provide: TRACKING_PROVIDER,
          useFactory: (platform: string, injector: Injector) =>
            platform === 'matomo'
              ? injector.get(MatomoTrackingService)
              : injector.get(GATrackingService),
          deps: [TRACKING_PLATFORM, Injector],
        },
        MatomoTrackingService,
        GATrackingService,
        AmritTrackingService,
      ],
    };
  }
}

// Re-export the tokens from the module if needed elsewhere
export { TRACKING_PLATFORM, MATOMO_SITE_ID, MATOMO_URL, TRACKING_PROVIDER } from './tracking.tokens';