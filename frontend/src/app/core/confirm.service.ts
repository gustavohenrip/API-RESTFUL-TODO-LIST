import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface DialogState {
  options: Required<ConfirmOptions>;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<DialogState | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.set({
        options: {
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel ?? 'Confirm',
          cancelLabel: options.cancelLabel ?? 'Cancel',
          tone: options.tone ?? 'default',
        },
        resolve,
      });
    });
  }

  confirm(): void {
    this.resolveWith(true);
  }

  cancel(): void {
    this.resolveWith(false);
  }

  private resolveWith(value: boolean): void {
    const current = this.state();
    if (!current) {
      return;
    }
    current.resolve(value);
    this.state.set(null);
  }
}
