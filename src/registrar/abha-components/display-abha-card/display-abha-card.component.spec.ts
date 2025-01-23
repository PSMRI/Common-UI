import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayAbhaCardComponent } from './display-abha-card.component';

describe('DisplayAbhaCardComponent', () => {
  let component: DisplayAbhaCardComponent;
  let fixture: ComponentFixture<DisplayAbhaCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayAbhaCardComponent]
    });
    fixture = TestBed.createComponent(DisplayAbhaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
