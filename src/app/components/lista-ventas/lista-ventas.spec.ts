import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaVentas } from './lista-ventas';

describe('ListaVentas', () => {
  let component: ListaVentas;
  let fixture: ComponentFixture<ListaVentas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaVentas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaVentas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
