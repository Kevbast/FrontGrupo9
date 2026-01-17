import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecioDialog } from './precio-dialog';

describe('PrecioDialog', () => {
  let component: PrecioDialog;
  let fixture: ComponentFixture<PrecioDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrecioDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrecioDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
