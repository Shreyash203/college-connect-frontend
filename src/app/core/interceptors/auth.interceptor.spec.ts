import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { API_BASE_URL } from '../api.config';
import { TokenStore } from '../services/token-store.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  beforeEach(() => {
    localStorage.setItem('auth_token', 'old-token');
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient); backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { backend.verify(); localStorage.removeItem('auth_token'); });
  it('never attaches JWT to signed image URLs or unrelated hosts', () => {
    for (const url of ['https://example.blob.core.windows.net/photo?sig=test', API_BASE_URL + '.attacker.test/photo']) {
      http.get(url).subscribe();
      const req = backend.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBeFalse(); req.flush({});
    }
  });
  it('shares refresh and terminates all waiting requests on rejection', () => {
    let failures = 0;
    http.get(API_BASE_URL + '/a').subscribe({ error: () => failures++ });
    http.get(API_BASE_URL + '/b').subscribe({ error: () => failures++ });
    backend.expectOne(API_BASE_URL + '/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(API_BASE_URL + '/b').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(API_BASE_URL + '/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(failures).toBe(2); expect(TestBed.inject(TokenStore).get()).toBeNull();
  });
  it('preserves session when refresh fails due to connectivity', () => {
    http.get(API_BASE_URL + '/a').subscribe({ error: () => {} });
    backend.expectOne(API_BASE_URL + '/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(API_BASE_URL + '/auth/refresh').error(new ProgressEvent('error'));
    expect(TestBed.inject(TokenStore).get()).toBe('old-token');
  });
});
