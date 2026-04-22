import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { SessionState } from './models';

const futureDate = () => new Date(Date.now() + 60_000).toISOString();
const pastDate = () => new Date(Date.now() - 60_000).toISOString();

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    accessToken: 'token',
    expiresAt: futureDate(),
    user: {
      id: '1',
      username: 'alice',
      email: 'alice@example.com',
      active: true,
      createdAt: '',
      updatedAt: '',
    },
    ...overrides,
  };
}

describe('SessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('persists and exposes session via signals', () => {
    const service = TestBed.inject(SessionService);
    const session = makeSession();
    service.setSession(session);

    expect(service.token()).toBe('token');
    expect(service.user()?.username).toBe('alice');
    expect(JSON.parse(localStorage.getItem('todo.session.v1') ?? 'null')).toEqual(session);
  });

  it('clears session and storage', () => {
    const service = TestBed.inject(SessionService);
    service.setSession(makeSession());
    service.clear();

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('todo.session.v1')).toBeNull();
  });

  it('discards expired sessions on load', () => {
    localStorage.setItem('todo.session.v1', JSON.stringify(makeSession({ expiresAt: pastDate() })));
    const service = TestBed.inject(SessionService);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('todo.session.v1')).toBeNull();
  });

  it('updateUser replaces the stored user without dropping the token', () => {
    const service = TestBed.inject(SessionService);
    service.setSession(makeSession());
    service.updateUser({
      id: '1',
      username: 'alice',
      email: 'alice+new@example.com',
      active: true,
      createdAt: '',
      updatedAt: '',
    });

    expect(service.token()).toBe('token');
    expect(service.user()?.email).toBe('alice+new@example.com');
  });
});
