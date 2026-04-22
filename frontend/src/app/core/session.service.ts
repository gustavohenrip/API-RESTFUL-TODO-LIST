import { computed, Injectable, signal } from '@angular/core';
import { SessionState, User } from './models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'todo.session.v1';
  private readonly state = signal<SessionState | null>(this.readSession());
  private expiryTimer: number | null = null;

  readonly session = computed(() => this.state());
  readonly token = computed(() => this.state()?.accessToken ?? null);
  readonly user = computed<User | null>(() => this.state()?.user ?? null);

  constructor() {
    this.scheduleExpiry(this.state());
  }

  setSession(session: SessionState): void {
    this.state.set(session);
    this.persist(session);
    this.scheduleExpiry(session);
  }

  updateUser(user: User): void {
    const current = this.state();
    if (!current) {
      return;
    }

    const next: SessionState = { ...current, user };
    this.state.set(next);
    this.persist(next);
  }

  clear(): void {
    this.state.set(null);
    this.clearTimer();
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // storage unavailable, ignore
    }
  }

  private persist(session: SessionState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    } catch {
      // storage unavailable, keep only in memory
    }
  }

  private readSession(): SessionState | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SessionState;
      if (this.isExpired(parsed.expiresAt)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return parsed;
    } catch {
      try {
        localStorage.removeItem(this.storageKey);
      } catch {
        // ignore
      }
      return null;
    }
  }

  private scheduleExpiry(session: SessionState | null): void {
    this.clearTimer();
    if (!session) {
      return;
    }

    const msUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      this.clear();
      return;
    }

    const delay = Math.min(msUntilExpiry, 2_147_483_000);
    this.expiryTimer = window.setTimeout(() => this.clear(), delay);
  }

  private clearTimer(): void {
    if (this.expiryTimer !== null) {
      window.clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private isExpired(expiresAt: string): boolean {
    const time = new Date(expiresAt).getTime();
    return Number.isNaN(time) || time <= Date.now();
  }
}
