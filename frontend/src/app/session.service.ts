import { computed, Injectable, signal } from '@angular/core';
import { SessionState, User } from './models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'todo.session.v1';
  private readonly state = signal<SessionState | null>(this.readSession());

  readonly session = computed(() => this.state());
  readonly token = computed(() => this.state()?.accessToken ?? null);
  readonly user = computed<User | null>(() => this.state()?.user ?? null);

  setSession(session: SessionState): void {
    this.state.set(session);
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  updateUser(user: User): void {
    const current = this.state();
    if (!current) {
      return;
    }

    this.setSession({
      ...current,
      user,
    });
  }

  clear(): void {
    this.state.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private readSession(): SessionState | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionState;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
