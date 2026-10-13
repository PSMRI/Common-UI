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
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { noDecisionResult } from './core/consent-draft';
import { ConsentDialogOptions, ConsentDialogResult } from './core/consent.models';
import { ConsentDialogComponent } from './consent-dialog/consent-dialog.component';

/** Opens consent dialogs; they never close on backdrop click or Esc (FR-001a). */
@Injectable({ providedIn: 'root' })
export class ConsentDialogService {
  constructor(private dialog: MatDialog) {}

  open(options: ConsentDialogOptions): Observable<ConsentDialogResult> {
    const ref = this.dialog.open<ConsentDialogComponent, ConsentDialogOptions, ConsentDialogResult>(
      ConsentDialogComponent,
      {
        data: options,
        disableClose: true,
        width: 'min(960px, 95vw)',
        maxWidth: '95vw',
        maxHeight: '90vh',
      }
    );
    return ref.afterClosed().pipe(
      take(1),
      map((result) => result || noDecisionResult())
    );
  }
}
