import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddauctionComponent } from './addauction.component';

describe('AddauctionComponent', () => {
  let component: AddauctionComponent;
  let fixture: ComponentFixture<AddauctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddauctionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddauctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
