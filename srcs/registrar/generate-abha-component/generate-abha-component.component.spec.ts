import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateAbhaComponentComponent } from './generate-abha-component.component';

describe('GenerateAbhaComponentComponent', () => {
  let component: GenerateAbhaComponentComponent;
  let fixture: ComponentFixture<GenerateAbhaComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GenerateAbhaComponentComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateAbhaComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
