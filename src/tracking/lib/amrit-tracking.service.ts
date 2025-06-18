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
    // Initialise underlying provider
    this.trackingProvider.init?.();
    
    // Initialize automatic page view tracking
    this.setupPageViewTracking();
    
    // Set user ID if available
    this.setupUserTracking();
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
    if (userId) {
      this.trackingProvider.setUserId(userId);
    }
  }

  // Public methods to track events
  trackEvent(category: string, action: string, label?: string, value?: number) {
    this.trackingProvider.event(category, action, label, value);
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
    this.trackEvent('Error', errorMessage, errorSource);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}