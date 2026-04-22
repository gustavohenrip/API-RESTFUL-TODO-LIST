import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { AuthResponse } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { fieldError } from '../../shared/field-error';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);

  readonly mode = signal<Mode>('login');
  readonly busy = signal(false);
  readonly authIndex = computed(() => (this.mode() === 'login' ? 0 : 1));

  readonly loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  readonly registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  readonly fieldError = fieldError;

  switchMode(next: Mode): void {
    if (this.mode() === next) {
      return;
    }
    this.feedback.clear();
    this.mode.set(next);
  }

  async submit(): Promise<void> {
    if (this.mode() === 'login') {
      await this.login();
      return;
    }
    await this.register();
  }

  private async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.feedback.clear();

    try {
      const payload = {
        username: this.loginForm.controls.username.value.trim(),
        password: this.loginForm.controls.password.value,
      };
      const response = await firstValueFrom(this.api.login(payload));
      this.applySession(response);
      this.loginForm.reset({ username: payload.username, password: '' });
      this.feedback.notify('Signed in');
      await this.router.navigate(['/tasks']);
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.feedback.clear();

    try {
      const payload = {
        username: this.registerForm.controls.username.value.trim(),
        email: this.registerForm.controls.email.value.trim(),
        password: this.registerForm.controls.password.value,
      };
      await firstValueFrom(this.api.register(payload));
      const response = await firstValueFrom(
        this.api.login({ username: payload.username, password: payload.password }),
      );
      this.applySession(response);
      this.registerForm.reset({ username: '', email: '', password: '' });
      this.feedback.notify('Account created');
      await this.router.navigate(['/tasks']);
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private applySession(response: AuthResponse): void {
    this.session.setSession({
      accessToken: response.accessToken,
      expiresAt: response.expiresAt,
      user: {
        id: response.id,
        username: response.username,
        email: response.email,
        active: response.active,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
    });
  }
}
