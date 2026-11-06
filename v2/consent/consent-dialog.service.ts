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
import { ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { noDecisionResult } from '../../src/consent/core/consent-draft';
import { ConsentDialogOptions, ConsentDialogResult } from '../../src/consent/core/consent.models';
import { ConsentDialogComponent } from './consent-dialog/consent-dialog.component';

/** Opens consent dialogs; they never close on backdrop click or Esc (FR-001a). */
@Injectable({ providedIn: 'root' })
export class ConsentDialogService {
  constructor(private dialog: ZardDialogService) {}

  open(options: ConsentDialogOptions): Observable<ConsentDialogResult> {
    const ref = this.dialog.create<ConsentDialogComponent, ConsentDialogOptions>({
      zContent: ConsentDialogComponent,
      zData: options,
      zMaskClosable: false,
      zClosable: false,
      zHideFooter: true,
      zWidth: 'min(960px, 95vw)',
    });
    return ref.afterClosed().pipe(
      take(1),
      map((result) => (result as ConsentDialogResult | undefined) || noDecisionResult())
    );
  }
}
