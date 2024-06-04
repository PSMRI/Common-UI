import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthIdValidatepopupComponent } from './health-id-validatepopup.component';

describe('HealthIdValidatepopupComponent', () => {
  let component: HealthIdValidatepopupComponent;
  let fixture: ComponentFixture<HealthIdValidatepopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HealthIdValidatepopupComponent]
    });
    fixture = TestBed.createComponent(HealthIdValidatepopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
