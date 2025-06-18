import { Injectable, Inject, OnDestroy } from '@angular/core';
import { TrackingProvider } from './tracking-provider';
import { SessionStorageService } from '../../registrar/services/session-storage.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TRACKING_PROVIDER } from './tracking.tokens';

@Injectable({
  providedIn: 'root'
})
export class AmritTrackingService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(TRACKING_PROVIDER) private trackingProvider: TrackingProvider,
    private sessionStorage: SessionStorageService,
    private router: Router
  ) {
    try {
      // Attempt to initialize the tracking provider
      this.trackingProvider.init?.();

      // Initialize automatic page view tracking
      this.setupPageViewTracking();

      // Set user ID if available
      this.setupUserTracking();
    } catch (error) {
      console.error('Error initializing tracking provider:', error);

      this.trackingProvider = {
        init: () => console.warn('Fallback: Tracking provider initialization failed'),
        setUserId: () => console.warn('Fallback: Tracking provider setUserId failed'),
        pageView: () => console.warn('Fallback: Tracking provider pageView failed'),
        event: () => console.warn('Fallback: Tracking provider event failed'),
      };

      this.trackingProvider.init();
    }
  }

  private setupPageViewTracking() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.trackingProvider.pageView(event.urlAfterRedirects);
    });
  }

  private setupUserTracking() {
    const userId = this.sessionStorage.getItem('userID');
    if (typeof userId === 'string' && userId !== null && userId !== undefined && userId !== '') {
      this.trackingProvider.setUserId(userId);
    }
  }

  // Public methods to track events
  trackEvent(category: string, action: string, label?: string, value?: number) {
    if (label !== undefined && value !== undefined) {
      this.trackingProvider.event(category, action, label, value);
    } else if (label !== undefined) {
      this.trackingProvider.event(category, action, label);
    } else if (value !== undefined) {
      this.trackingProvider.event(category, action, undefined, value);
    } else {
      this.trackingProvider.event(category, action);
    }
  }

  // Specific tracking methods for common actions
  trackButtonClick(buttonName: string) {
    this.trackEvent('UI', 'ButtonClick', buttonName);
  }

  trackFormSubmit(formName: string) {
    this.trackEvent('Form', 'Submit', formName);
  }

  trackFeatureUsage(featureName: string) {
    this.trackEvent('Feature', 'Usage', featureName);
  }

  trackError(errorMessage: string, errorSource?: string) {
    if (errorSource !== undefined) {
      this.trackEvent('Error', errorMessage, errorSource);
    } else {
      this.trackEvent('Error', errorMessage);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}