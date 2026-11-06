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
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

/** An OnPush container, like Zard's dialog container, to catch views that miss markForCheck. */
@Component({
  selector: 'consent-on-push-host',
  standalone: true,
  template: '<ng-container #slot></ng-container>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnPushHostComponent {
  @ViewChild('slot', { read: ViewContainerRef, static: true }) slot!: ViewContainerRef;
}

export function createInOnPushHost<T>(type: Type<T>): {
  host: ComponentFixture<OnPushHostComponent>;
  ref: ComponentRef<T>;
} {
  const host = TestBed.createComponent(OnPushHostComponent);
  host.detectChanges();
  const ref = host.componentInstance.slot.createComponent(type);
  return { host, ref };
}
