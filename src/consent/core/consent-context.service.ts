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

import { Injectable } from '@angular/core';
import { SessionStorageService } from '../../registrar/services/session-storage.service';
import { ConsentCaptureContext } from './consent.models';
import { getDeviceId } from './evidence.util';

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Local time as ISO 8601 with the UTC offset, e.g. 2026-10-13T10:15:00+05:30. */
export function toIsoWithOffset(date: Date): string {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    sign +
    pad(Math.floor(abs / 60)) +
    ':' +
    pad(abs % 60)
  );
}

/** Session values attached to every consent as proof (research R13). */
@Injectable({ providedIn: 'root' })
export class ConsentContextService {
  constructor(private sessionstorage: SessionStorageService) {}

  context(now: Date = new Date()): ConsentCaptureContext {
    return {
      capturedBy: this.numberItem('userID'),
      providerServiceMapId: this.numberItem('providerServiceID'),
      facilityId: this.numberItem('facilityID'),
      servicePointId: this.numberItem('servicePointID'),
      serviceLine: this.stringItem('serviceName'),
      deviceId: getDeviceId(),
      capturedAt: toIsoWithOffset(now),
    };
  }

  private numberItem(key: string): number | null {
    const raw = this.stringItem(key);
    const value = Number(raw);
    return raw === null || isNaN(value) ? null : value;
  }

  private stringItem(key: string): string | null {
    const value = this.sessionstorage.getItem(key);
    return value === null || value === undefined || value === ''
      ? null
      : String(value);
  }
}
