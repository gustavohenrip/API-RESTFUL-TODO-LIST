import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends pagination params for listTasks', () => {
    service.listTasks({ completed: true, page: 1, size: 10 }).subscribe();

    const req = httpMock.expectOne((request) => request.url === `${environment.apiUrl}/tasks`);
    expect(req.request.params.get('completed')).toBe('true');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
  });

  it('posts credentials to login endpoint', () => {
    service.login({ username: 'alice', password: 'secret12' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'alice', password: 'secret12' });
    req.flush({});
  });
});
