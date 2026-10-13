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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockPurposes } from './consent.mock';
import { Type } from '@angular/core';
import { PurposesStepBase } from '../ui/purposes-step.base';

/** How a track renders a purpose switch. */
export interface SwitchAdapter {
  selector: string;
  isOn(el: HTMLElement): boolean;
}

/** Behaviour suite run by each track's purposes step spec. */
export function purposesStepSuite(PurposesStepComponent: Type<PurposesStepBase>, track: string, switches: SwitchAdapter): void {
describe(`PurposesStepComponent (${track})`, () => {
  let fixture: ComponentFixture<PurposesStepBase>;
  let component: PurposesStepBase;

  function inputs(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(switches.selector));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PurposesStepComponent] });
    fixture = TestBed.createComponent(PurposesStepComponent);
    component = fixture.componentInstance;
    component.text = { mandatory: 'Required', optional: 'Optional' };
    component.purposes = mockPurposes();
    component.decisions = {};
    fixture.detectChanges();
  });

  it('lists mandatory purposes first with their label', () => {
    const items: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('li'));
    expect(items.length).toBe(6);
    expect(items[0].textContent).toContain('Registration');
    expect(items[0].textContent).toContain('Required');
    expect(items[1].textContent).toContain('Treatment');
    expect(items[2].textContent).toContain('Optional');
  });

  it('starts with every switch off', () => {
    expect(inputs().every((i) => !switches.isOn(i))).toBeTrue();
  });

  it('emits the full decision map when a switch changes', () => {
    const emitted: { [k: string]: boolean }[] = [];
    component.decisionsChange.subscribe((d) => emitted.push(d));
    component.decisions = { 'P-TRT': true };
    inputs()[0].click();
    expect(emitted[0]).toEqual({ 'P-TRT': true, 'P-REG': true });
  });

  it('reflects decisions and resets when inputs reset', () => {
    component.decisions = { 'P-REG': true };
    fixture.detectChanges();
    expect(switches.isOn(inputs()[0])).toBeTrue();
    component.decisions = {};
    fixture.detectChanges();
    expect(switches.isOn(inputs()[0])).toBeFalse();
  });

  it('accepts an empty purpose list', () => {
    component.purposes = null as never;
    fixture.detectChanges();
    expect(inputs().length).toBe(0);
  });
});
}
