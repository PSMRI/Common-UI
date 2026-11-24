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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeclineConfirmComponent } from './decline-confirm.component';

describe('DeclineConfirmComponent', () => {
  let fixture: ComponentFixture<DeclineConfirmComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DeclineConfirmComponent, boolean>>;

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [DeclineConfirmComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Decline consent?', message: 'Cannot continue', confirmLabel: 'Confirm decline', cancelLabel: 'Go back' },
        },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    });
    fixture = TestBed.createComponent(DeclineConfirmComponent);
    fixture.detectChanges();
  });

  function el(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  it('shows the title, the message and both buttons in one action row', () => {
    expect(el('.decline-confirm-title').textContent).toContain('Decline consent?');
    expect(el('.decline-confirm-message').textContent).toContain('Cannot continue');
    const row = el('.decline-confirm-actions');
    expect(row.querySelector('.decline-confirm-cancel')!.textContent).toContain('Go back');
    expect(row.querySelector('.decline-confirm-ok')!.textContent).toContain('Confirm decline');
  });

  it('closes with true on confirm and false on go back', () => {
    (el('.decline-confirm-ok') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    (el('.decline-confirm-cancel') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
