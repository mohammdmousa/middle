import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationRequestsComponent } from './documentation-requests.component';

describe('DocumentationRequestsComponent', () => {
  let component: DocumentationRequestsComponent;
  let fixture: ComponentFixture<DocumentationRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentationRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentationRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
