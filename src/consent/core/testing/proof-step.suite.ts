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
import { ConsentMode, ProofDraft } from '../consent.models';
import { Type } from '@angular/core';
import { ProofStepBase } from '../ui/proof-step.base';

/** Behaviour suite run by each track's proof step spec. */
export function proofStepSuite(ProofStepComponent: Type<ProofStepBase>, track: string): void {
describe(`ProofStepComponent (${track})`, () => {
  let fixture: ComponentFixture<ProofStepBase>;
  let component: ProofStepBase;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProofStepComponent] });
    fixture = TestBed.createComponent(ProofStepComponent);
    component = fixture.componentInstance;
    component.text = { mode: 'How?', modeSelfRead: 'Patient read it', modeOtp: 'OTP' };
    fixture.detectChanges();
  });

  it('offers all six consent modes', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Patient read it');
  });

  it('emits the mode and an empty proof for self-read', () => {
    const modes: ConsentMode[] = [];
    const proofs: ProofDraft[] = [];
    component.modeChange.subscribe((m) => modes.push(m));
    component.proofChange.subscribe((p) => proofs.push(p));
    (fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement).click();
    expect(modes).toEqual(['SELF_READ']);
    expect(proofs).toEqual([{}]);
  });
});
}
