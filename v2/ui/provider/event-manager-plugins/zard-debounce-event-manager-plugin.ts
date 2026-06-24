/*
 * AMRIT – Accessible Medical Records via Integrated Technologies
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

import type { ListenerOptions } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';

export class ZardDebounceEventManagerPlugin extends EventManagerPlugin {
  override supports(eventName: string): boolean {
    return /\.debounce(?:\.|$)/.test(eventName);
  }

  override addEventListener(
    element: HTMLElement,
    eventName: string,
    handler: (event: Event) => void,
    options?: ListenerOptions,
    // eslint-disable-next-line @typescript-eslint/ban-types
  ): Function {
    // Expected format: "event.debounce.delay" (e.g., "input.debounce.150")
    // If delay is omitted or invalid, defaults to 300ms
    const [event, , delay] = eventName.split('.');
    const parsedDelay = Number.parseInt(delay);
    const resolvedDelay = Number.isNaN(parsedDelay) ? 300 : parsedDelay;

    let timeoutId!: ReturnType<typeof setTimeout>;
    const listener = (event: Event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(event), resolvedDelay);
    };
    const unsubscribe = this.manager.addEventListener(element, event, listener, options);
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }
}
