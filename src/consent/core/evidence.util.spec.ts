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

import {
  getDeviceId,
  isVoiceDurationValid,
  maskPhone,
  sha256Hex,
  uuidV4,
} from './evidence.util';

describe('evidence.util', () => {
  const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  describe('uuidV4', () => {
    it('returns distinct v4 UUIDs', () => {
      const a = uuidV4();
      const b = uuidV4();
      expect(a).toMatch(UUID_V4);
      expect(b).toMatch(UUID_V4);
      expect(a).not.toBe(b);
    });
  });

  describe('sha256Hex', () => {
    it('hashes a blob when SubtleCrypto exists', async () => {
      const hex = await sha256Hex(new Blob(['abc']));
      expect(hex).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
    });

    it('resolves null when SubtleCrypto is unavailable', async () => {
      spyOnProperty(crypto, 'subtle', 'get').and.returnValue(
        undefined as unknown as SubtleCrypto
      );
      expect(await sha256Hex(new Blob(['abc']))).toBeNull();
    });
  });

  describe('isVoiceDurationValid', () => {
    it('accepts 30 to 60 seconds inclusive', () => {
      expect(isVoiceDurationValid(30)).toBeTrue();
      expect(isVoiceDurationValid(45)).toBeTrue();
      expect(isVoiceDurationValid(60)).toBeTrue();
    });

    it('rejects out of range or missing values', () => {
      expect(isVoiceDurationValid(29.9)).toBeFalse();
      expect(isVoiceDurationValid(60.1)).toBeFalse();
      expect(isVoiceDurationValid(null)).toBeFalse();
      expect(isVoiceDurationValid(undefined)).toBeFalse();
    });
  });

  describe('maskPhone', () => {
    it('keeps the first and last two digits', () => {
      expect(maskPhone('9876543212')).toBe('98******12');
    });

    it('returns empty for missing or short input', () => {
      expect(maskPhone(null)).toBe('');
      expect(maskPhone(undefined)).toBe('');
      expect(maskPhone('123')).toBe('');
    });
  });

  describe('getDeviceId', () => {
    const KEY = 'amrit.consent.deviceId';

    afterEach(() => localStorage.removeItem(KEY));

    it('creates, stores and reuses one id', () => {
      localStorage.removeItem(KEY);
      const first = getDeviceId();
      expect(first).toMatch(UUID_V4);
      expect(localStorage.getItem(KEY)).toBe(first);
      expect(getDeviceId()).toBe(first);
    });

    it('returns a fresh uuid when storage throws', () => {
      spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
      expect(getDeviceId()).toMatch(UUID_V4);
    });
  });
});
