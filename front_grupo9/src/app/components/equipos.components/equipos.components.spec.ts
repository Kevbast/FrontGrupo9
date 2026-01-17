import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquiposComponents } from './equipos.components';

describe('EquiposComponents', () => {
  let component: EquiposComponents;
  let fixture: ComponentFixture<EquiposComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EquiposComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquiposComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
