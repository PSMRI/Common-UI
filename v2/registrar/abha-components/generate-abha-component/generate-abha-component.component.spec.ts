import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateAbhaComponentComponent } from './generate-abha-component.component';

describe('GenerateAbhaComponentComponent', () => {
  let component: GenerateAbhaComponentComponent;
  let fixture: ComponentFixture<GenerateAbhaComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GenerateAbhaComponentComponent]
    });
    fixture = TestBed.createComponent(GenerateAbhaComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
