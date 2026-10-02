import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxYeti } from './ngx-yeti';

describe('NgxYeti', () => {
  let component: NgxYeti;
  let fixture: ComponentFixture<NgxYeti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxYeti],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxYeti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
