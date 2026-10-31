import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('auth_token');
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
  });
  it('renders the College Connect brand', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('CollegeConnect');
    fixture.destroy();
  });
});
