/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from '../../registrar/services/session-storage.service';
import { defaultResolvedConfig } from './consent-config';
import {
  ConsentConfigUnavailable,
  ContextConfig,
  ResolvedConsentConfig,
} from './consent-config.models';
import { ConsentContextType, OutputResponse } from './consent.models';

/** Request body: the same values registration customisation sends to fetchAllData, plus the context (R1). */
export interface ConsentConfigRequest {
  serviceLine: string | null;
  serviceLineId: number | null;
  stateId: number | null;
  districtId: number | null;
  blockId: number | null;
  serviceProviderId: number | null;
  context: ConsentContextType;
}

interface ConsentConfigResponse {
  projectId: number;
  version: number;
  context: ConsentContextType;
  config: ContextConfig;
}

// Hosts that never add the key must still compile, so it is read through a cast (FR-024).
function consentConfigUrl(): string {
  const url = (environment as { getConsentConfigUrl?: unknown }).getConsentConfigUrl;
  return typeof url === 'string' ? url : '';
}

function parse(value: unknown): any {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return value === null || value === undefined || value === '' || isNaN(n) ? null : n;
}

/** Loads the consent configuration of the logged-in user's project (feature 002, research R6). */
@Injectable({ providedIn: 'root' })
export class ConsentConfigService {
  constructor(
    private http: HttpClient,
    private sessionstorage: SessionStorageService
  ) {}

  /**
   * Emits the project's configuration, or the platform default when there is no project, no
   * configuration, no URL or no endpoint (404). On any other failure it emits this login session's
   * last copy, or errors with ConsentConfigUnavailable when there is none.
   */
  load(context: ConsentContextType): Observable<ResolvedConsentConfig> {
    const url = consentConfigUrl();
    const request = this.request(context);
    if (!url || !request) {
      return of(defaultResolvedConfig(context));
    }
    const key = this.cacheKey(request);
    return this.http.post<OutputResponse<ConsentConfigResponse | null>>(url, request).pipe(
      map((res) => {
        if (!res || res.statusCode !== 200) {
          throw res;
        }
        const resolved: ResolvedConsentConfig = res.data
          ? {
              projectId: res.data.projectId,
              version: res.data.version,
              context,
              config: res.data.config,
              source: 'PROJECT',
            }
          : defaultResolvedConfig(context);
        this.sessionstorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      }),
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          return of(defaultResolvedConfig(context));
        }
        const copy = parse(this.sessionstorage.getItem(key)) as ResolvedConsentConfig | null;
        return copy && copy.config
          ? of({ ...copy, source: 'SESSION_CACHE' as const })
          : throwError(() => new ConsentConfigUnavailable());
      })
    );
  }

  /** null when the session has no usable location, which means no project can match. */
  private request(context: ConsentContextType): ConsentConfigRequest | null {
    const location = parse(this.sessionstorage.getItem('locationData'));
    const services = parse(this.sessionstorage.getItem('services'));
    if (!location || typeof location !== 'object') {
      return null;
    }
    const provider = Array.isArray(services) && services.length > 0 ? services[0] : null;
    const serviceName = this.sessionstorage.getItem('serviceName');
    return {
      serviceLine: serviceName === null || serviceName === undefined ? null : String(serviceName),
      serviceLineId: toNumber(this.sessionstorage.getItem('serviceID')),
      stateId: toNumber(location.stateID),
      districtId: toNumber(location.districtID),
      blockId: toNumber(location.blockID),
      serviceProviderId: toNumber(provider ? provider.serviceProviderID : null),
      context,
    };
  }

  private cacheKey(r: ConsentConfigRequest): string {
    return ['consentConfig', r.serviceLineId, r.stateId, r.districtId, r.blockId, r.context].join(':');
  }
}
