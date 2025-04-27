import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetilesAdvertisementsComponent } from './detiles-advertisements.component';

describe('DetilesAdvertisementsComponent', () => {
  let component: DetilesAdvertisementsComponent;
  let fixture: ComponentFixture<DetilesAdvertisementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetilesAdvertisementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetilesAdvertisementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
