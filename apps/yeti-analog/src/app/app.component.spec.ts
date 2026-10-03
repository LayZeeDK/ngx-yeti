import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe(AppComponent, () => {
  it('creates the app', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeInstanceOf(AppComponent);
  });
});
