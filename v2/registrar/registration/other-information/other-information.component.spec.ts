import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherInformationComponent } from './other-information.component';

describe('OtherInformationComponent', () => {
  let component: OtherInformationComponent;
  let fixture: ComponentFixture<OtherInformationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OtherInformationComponent]
    });
    fixture = TestBed.createComponent(OtherInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
