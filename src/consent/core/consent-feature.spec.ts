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

import { environment } from 'src/environments/environment';
import { consentApiBase, isConsentFeatureEnabled } from './consent-feature';

describe('consent-feature', () => {
  const env = environment as { consentManagement?: unknown };
  let original: unknown;

  beforeEach(() => {
    original = env.consentManagement;
  });

  afterEach(() => {
    env.consentManagement = original;
  });

  it('is off when the key is absent', () => {
    delete env.consentManagement;
    expect(isConsentFeatureEnabled()).toBeFalse();
    expect(consentApiBase()).toBe('');
  });

  it('is off when enabled is false', () => {
    env.consentManagement = { enabled: false, apiBase: 'http://api' };
    expect(isConsentFeatureEnabled()).toBeFalse();
  });

  it('is off when enabled is the string "true"', () => {
    env.consentManagement = { enabled: 'true' };
    expect(isConsentFeatureEnabled()).toBeFalse();
  });

  it('is on only when enabled is boolean true', () => {
    env.consentManagement = { enabled: true };
    expect(isConsentFeatureEnabled()).toBeTrue();
  });

  it('returns apiBase without trailing slashes', () => {
    env.consentManagement = { enabled: true, apiBase: 'http://api//' };
    expect(consentApiBase()).toBe('http://api');
  });

  it('returns empty base when apiBase is not a string', () => {
    env.consentManagement = { enabled: true, apiBase: 42 };
    expect(consentApiBase()).toBe('');
  });
});
