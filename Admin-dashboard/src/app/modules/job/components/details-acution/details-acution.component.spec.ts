import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsAcutionComponent } from './details-acution.component';

describe('DetailsAcutionComponent', () => {
  let component: DetailsAcutionComponent;
  let fixture: ComponentFixture<DetailsAcutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailsAcutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsAcutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
