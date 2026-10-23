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

import { NgFor, NgSwitch, NgSwitchCase } from '@angular/common';
import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProofStepBase } from '../../core/ui/proof-step.base';
import { MediaCaptureComponent } from '../../media-capture/media-capture.component';
import { OtpVerifyComponent } from '../../otp-verify/otp-verify.component';

@Component({
  selector: 'app-consent-proof-step',
  templateUrl: './proof-step.component.html',
  styleUrls: ['./proof-step.component.css'],
  standalone: true,
  imports: [
    NgFor,
    NgSwitch,
    NgSwitchCase,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MediaCaptureComponent,
    OtpVerifyComponent,
  ],
})
export class ProofStepComponent extends ProofStepBase {}
