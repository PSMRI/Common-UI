import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaInformationComponent } from './abha-information.component';

describe('AbhaInformationComponent', () => {
  let component: AbhaInformationComponent;
  let fixture: ComponentFixture<AbhaInformationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaInformationComponent]
    });
    fixture = TestBed.createComponent(AbhaInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
