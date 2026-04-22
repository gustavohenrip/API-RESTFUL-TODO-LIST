import { Injectable, signal } from '@angular/core';

type Kind = 'message' | 'error';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly message = signal('');
  readonly error = signal('');
  private timer: number | null = null;

  notify(text: string): void {
    this.set('message', text);
  }

  fail(text: string): void {
    this.set('error', text);
  }

  clear(): void {
    this.message.set('');
    this.error.set('');
    this.clearTimer();
  }

  readError(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return 'Error';
    }

    const response = error as {
      error?: { message?: string; details?: string[] };
      message?: string;
    };

    const detail = response.error?.details?.[0];
    if (detail) {
      return detail;
    }

    if (response.error?.message) {
      return response.error.message;
    }

    if (response.message) {
      return response.message;
    }

    return 'Error';
  }

  private set(kind: Kind, text: string): void {
    this.clear();
    if (kind === 'message') {
      this.message.set(text);
    } else {
      this.error.set(text);
    }
    this.timer = window.setTimeout(() => {
      this.message.set('');
      this.error.set('');
      this.timer = null;
    }, 2500);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
