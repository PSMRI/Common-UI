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

import { TestBed } from '@angular/core/testing';
import { SessionStorageService } from '../../registrar/services/session-storage.service';
import { ConsentContextService, toIsoWithOffset } from './consent-context.service';
import { mockSession } from './testing/consent.mock';

describe('ConsentContextService', () => {
  let store: { [key: string]: unknown };
  let service: ConsentContextService;

  beforeEach(() => {
    store = { ...mockSession() };
    const session = jasmine.createSpyObj<SessionStorageService>('SessionStorageService', ['getItem']);
    session.getItem.and.callFake((key: string) => store[key]);
    TestBed.configureTestingModule({
      providers: [{ provide: SessionStorageService, useValue: session }],
    });
    service = TestBed.inject(ConsentContextService);
  });

  it('reads proof values from the session', () => {
    const now = new Date(2026, 9, 13, 10, 15, 0);
    const ctx = service.context(now);
    expect(ctx.capturedBy).toBe(4521);
    expect(ctx.providerServiceMapId).toBe(1714);
    expect(ctx.facilityId).toBe(33);
    expect(ctx.servicePointId).toBe(7);
    expect(ctx.serviceLine).toBe('MMU');
    expect(ctx.deviceId).toBeTruthy();
    expect(ctx.capturedAt).toBe(toIsoWithOffset(now));
  });

  it('returns null, never NaN, for missing or invalid values', () => {
    store = { userID: 'abc', providerServiceID: '', facilityID: null };
    const ctx = service.context();
    expect(ctx.capturedBy).toBeNull();
    expect(ctx.providerServiceMapId).toBeNull();
    expect(ctx.facilityId).toBeNull();
    expect(ctx.servicePointId).toBeNull();
    expect(ctx.serviceLine).toBeNull();
  });

  describe('toIsoWithOffset', () => {
    it('formats local time with a positive offset', () => {
      const d = new Date(2026, 0, 5, 9, 3, 7);
      spyOn(d, 'getTimezoneOffset').and.returnValue(-330);
      expect(toIsoWithOffset(d)).toBe('2026-01-05T09:03:07+05:30');
    });

    it('formats a negative offset', () => {
      const d = new Date(2026, 10, 15, 23, 59, 59);
      spyOn(d, 'getTimezoneOffset').and.returnValue(300);
      expect(toIsoWithOffset(d)).toBe('2026-11-15T23:59:59-05:00');
    });
  });
});
