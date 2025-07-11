import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbhaMobileComponentComponent } from './abha-mobile-component.component';

describe('AbhaMobileComponentComponent', () => {
  let component: AbhaMobileComponentComponent;
  let fixture: ComponentFixture<AbhaMobileComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AbhaMobileComponentComponent]
    });
    fixture = TestBed.createComponent(AbhaMobileComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
