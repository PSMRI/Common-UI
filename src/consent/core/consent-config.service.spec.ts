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

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from '../../registrar/services/session-storage.service';
import { DEFAULT_CONTEXT_CONFIG } from './consent-config';
import { ConsentConfigUnavailable, ResolvedConsentConfig } from './consent-config.models';
import { ConsentConfigService } from './consent-config.service';
import { mockFullContext } from './testing/consent-config.mock';

const URL = 'http://test/common-api/customization/consent/fetchConsentConfig';
const KEY = 'consentConfig:2:17:211:1804:REGISTRATION';

describe('ConsentConfigService', () => {
  const env = environment as { getConsentConfigUrl?: unknown };
  let original: unknown;
  let service: ConsentConfigService;
  let http: HttpTestingController;
  let store: { [key: string]: unknown };
  let session: jasmine.SpyObj<SessionStorageService>;

  function collect(context: 'REGISTRATION' | 'REVISIT' = 'REGISTRATION') {
    const out: { value?: ResolvedConsentConfig; error?: unknown } = {};
    service.load(context).subscribe({
      next: (v) => (out.value = v),
      error: (e) => (out.error = e),
    });
    return out;
  }

  beforeEach(() => {
    original = env.getConsentConfigUrl;
    env.getConsentConfigUrl = URL;
    store = {
      serviceName: 'MMU',
      serviceID: '2',
      locationData: JSON.stringify({ stateID: 17, districtID: 211, blockID: 1804 }),
      services: JSON.stringify([{ serviceProviderID: 1 }]),
    };
    session = jasmine.createSpyObj('SessionStorageService', ['getItem', 'setItem']);
    session.getItem.and.callFake((k: string) => (k in store ? store[k] : null));
    session.setItem.and.callFake((k: string, v: unknown) => (store[k] = v));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: SessionStorageService, useValue: session }],
    });
    service = TestBed.inject(ConsentConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    env.getConsentConfigUrl = original;
  });

  it('posts the registration-customisation location values with the context', () => {
    collect('REVISIT');
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serviceLine: 'MMU',
      serviceLineId: 2,
      stateId: 17,
      districtId: 211,
      blockId: 1804,
      serviceProviderId: 1,
      context: 'REVISIT',
    });
    req.flush({ statusCode: 200, data: null });
  });

  it('returns the project configuration and keeps a session copy', () => {
    const out = collect();
    http.expectOne(URL).flush({
      statusCode: 200,
      data: { projectId: 12, version: 4, context: 'REGISTRATION', config: mockFullContext() },
    });
    expect(out.value).toEqual({
      projectId: 12,
      version: 4,
      context: 'REGISTRATION',
      config: mockFullContext(),
      source: 'PROJECT',
    });
    expect(JSON.parse(store[KEY] as string).projectId).toBe(12);
  });

  it('returns the platform default when no project is configured', () => {
    const out = collect();
    http.expectOne(URL).flush({ statusCode: 200, data: null });
    expect(out.value?.source).toBe('DEFAULT');
    expect(out.value?.config).toBe(DEFAULT_CONTEXT_CONFIG);
    expect(out.value?.projectId).toBeNull();
  });

  it('returns the platform default without a call when the host has no URL', () => {
    delete env.getConsentConfigUrl;
    const out = collect();
    http.expectNone(URL);
    expect(out.value?.source).toBe('DEFAULT');
  });

  it('returns the platform default without a call when the URL is not a string', () => {
    env.getConsentConfigUrl = 42;
    expect(collect().value?.source).toBe('DEFAULT');
  });

  it('returns the platform default when the endpoint is not deployed (404)', () => {
    store[KEY] = JSON.stringify({ projectId: 12, version: 4, context: 'REGISTRATION', config: mockFullContext() });
    const out = collect();
    http.expectOne(URL).flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(out.value?.source).toBe('DEFAULT');
  });

  it('uses the session copy when the call fails', () => {
    store[KEY] = JSON.stringify({ projectId: 12, version: 4, context: 'REGISTRATION', config: mockFullContext() });
    const out = collect();
    http.expectOne(URL).flush('down', { status: 503, statusText: 'Unavailable' });
    expect(out.value?.source).toBe('SESSION_CACHE');
    expect(out.value?.version).toBe(4);
  });

  it('accepts a session copy stored as an object', () => {
    store[KEY] = { projectId: 12, version: 4, context: 'REGISTRATION', config: mockFullContext() };
    const out = collect();
    http.expectOne(URL).error(new ProgressEvent('error'));
    expect(out.value?.source).toBe('SESSION_CACHE');
  });

  it('treats a non-200 statusCode as a failure', () => {
    const out = collect();
    http.expectOne(URL).flush({ statusCode: 5000, errorMessage: 'boom' });
    expect(out.error instanceof ConsentConfigUnavailable).toBeTrue();
  });

  it('treats an empty body as a failure', () => {
    const out = collect();
    http.expectOne(URL).flush(null);
    expect(out.error instanceof ConsentConfigUnavailable).toBeTrue();
  });

  it('errors with ConsentConfigUnavailable when the call fails and no copy exists', () => {
    const out = collect();
    http.expectOne(URL).flush('down', { status: 500, statusText: 'Error' });
    expect(out.error instanceof ConsentConfigUnavailable).toBeTrue();
    expect((out.error as Error).name).toBe('ConsentConfigUnavailable');
  });

  it('ignores an unreadable or incomplete session copy', () => {
    store[KEY] = '{not json';
    const first = collect();
    http.expectOne(URL).flush('down', { status: 500, statusText: 'Error' });
    expect(first.error instanceof ConsentConfigUnavailable).toBeTrue();
    store[KEY] = JSON.stringify({ projectId: 12 });
    const second = collect();
    http.expectOne(URL).flush('down', { status: 500, statusText: 'Error' });
    expect(second.error instanceof ConsentConfigUnavailable).toBeTrue();
  });

  it('returns the platform default without a call when the location is missing or unreadable', () => {
    delete store['locationData'];
    expect(collect().value?.source).toBe('DEFAULT');
    store['locationData'] = '{broken';
    expect(collect().value?.source).toBe('DEFAULT');
    http.expectNone(URL);
  });

  it('sends nulls for missing service and provider values', () => {
    store = { locationData: { stateID: '', districtID: 'x' } };
    collect();
    const req = http.expectOne(URL);
    expect(req.request.body).toEqual({
      serviceLine: null,
      serviceLineId: null,
      stateId: null,
      districtId: null,
      blockId: null,
      serviceProviderId: null,
      context: 'REGISTRATION',
    });
    req.flush({ statusCode: 200, data: null });
  });

  it('sends a null provider when the services list is empty', () => {
    store['services'] = JSON.stringify([]);
    collect();
    const req = http.expectOne(URL);
    expect(req.request.body.serviceProviderId).toBeNull();
    req.flush({ statusCode: 200, data: null });
  });
});
