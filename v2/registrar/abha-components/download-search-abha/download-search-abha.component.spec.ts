import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadSearchAbhaComponent } from './download-search-abha.component';

describe('DownloadSearchAbhaComponent', () => {
  let component: DownloadSearchAbhaComponent;
  let fixture: ComponentFixture<DownloadSearchAbhaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DownloadSearchAbhaComponent]
    });
    fixture = TestBed.createComponent(DownloadSearchAbhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
