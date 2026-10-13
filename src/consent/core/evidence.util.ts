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

// Helpers for proof capture; safe on plain-HTTP van servers (research R8).

const DEVICE_ID_KEY = 'amrit.consent.deviceId';

/** UUID v4 from crypto.getRandomValues (available outside secure contexts). */
export function uuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] + 0x100).toString(16).substring(1));
  }
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
}

/** SHA-256 hex of a blob, or null when SubtleCrypto is unavailable (server computes it). */
export function sha256Hex(blob: Blob): Promise<string | null> {
  const subtle = crypto.subtle;
  if (!subtle) {
    return Promise.resolve(null);
  }
  return blob
    .arrayBuffer()
    .then((buffer) => subtle.digest('SHA-256', buffer))
    .then((digest) => {
      const bytes = new Uint8Array(digest);
      let out = '';
      for (let i = 0; i < bytes.length; i++) {
        out += (bytes[i] + 0x100).toString(16).substring(1);
      }
      return out;
    });
}

/** Voice clips must be 30–60 seconds inclusive (FR-015). */
export function isVoiceDurationValid(seconds: number | null | undefined): boolean {
  return typeof seconds === 'number' && seconds >= 30 && seconds <= 60;
}

/** '9876543212' -> '98******12' (FR-016). */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 4) {
    return '';
  }
  return (
    phone.substring(0, 2) +
    new Array(phone.length - 3).join('*') +
    phone.substring(phone.length - 2)
  );
}

/** Per-browser device ID; falls back to a fresh UUID when storage is blocked. */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
    const created = uuidV4();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return uuidV4();
  }
}
