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

import { Directive, EventEmitter, Input, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { ConsentApiService } from '../consent-api.service';
import { filterRtl } from '../consent-draft';
import { NoticeLanguage } from '../consent.models';

/** Language step logic shared by the Material and Zard tracks (FR-002). */
@Directive()
export abstract class LanguageStepBase implements OnInit {
  @Input() text: any;
  @Input() selected: string | null = null;
  @Output() languageSelected = new EventEmitter<string>();

  languages: NoticeLanguage[] = [];
  loading = false;
  failed = false;

  protected consentApi = inject(ConsentApiService);
  // Zard's dialog container is OnPush: async updates must mark this view for checking.
  protected cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.failed = false;
    this.consentApi.getLanguages('REGISTRATION').subscribe({
      next: (languages) => {
        this.languages = filterRtl(languages);
        this.failed = this.languages.length === 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.languages = [];
        this.failed = true;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  select(code: string): void {
    this.languageSelected.emit(code);
  }
}
