import { Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, Task } from './models';
import { SessionService } from './session.service';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private notificationTimer: number | null = null;

  readonly authMode = signal<'login' | 'register'>('login');
  readonly taskFilter = signal<'all' | 'open' | 'done'>('all');
  readonly authBusy = signal(false);
  readonly taskBusy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly tasks = signal<Task[]>([]);
  readonly editingTask = signal<Task | null>(null);
  readonly signedIn = computed(() => Boolean(this.session.token()));
  readonly authIndex = computed(() => (this.authMode() === 'login' ? 0 : 1));
  readonly filterIndex = computed(() => {
    switch (this.taskFilter()) {
      case 'open':
        return 1;
      case 'done':
        return 2;
      default:
        return 0;
    }
  });

  readonly loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  readonly registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  readonly taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  readonly visibleTasks = computed(() => {
    const tasks = this.tasks();
    const filter = this.taskFilter();

    if (filter === 'open') {
      return tasks.filter((task) => !task.completed);
    }

    if (filter === 'done') {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  });

  constructor() {
    effect(() => {
      if (!this.signedIn()) {
        this.resetWorkspace();
        return;
      }

      void this.syncSession();
    });
  }

  switchAuthMode(mode: 'login' | 'register'): void {
    if (this.authMode() === mode) {
      return;
    }

    this.clearFeedback();
    this.authMode.set(mode);
  }

  async submitAuth(): Promise<void> {
    if (this.authMode() === 'login') {
      await this.login();
      return;
    }

    await this.register();
  }

  async submitTask(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const title = this.taskForm.controls.title.value.trim();
    const description = this.normalizeText(this.taskForm.controls.description.value);

    this.taskBusy.set(true);
    this.clearFeedback();

    try {
      const editingTask = this.editingTask();

      if (editingTask) {
        await firstValueFrom(
          this.api.updateTask(editingTask.id, {
            title,
            description,
            completed: editingTask.completed,
          }),
        );
      } else {
        await firstValueFrom(this.api.createTask({ title, description }));
      }

      this.taskForm.reset({ title: '', description: '' });
      this.editingTask.set(null);
      await this.reloadTasks();
      this.flashMessage(editingTask ? 'Saved' : 'Added');
    } catch (error) {
      this.flashError(this.readError(error));
    } finally {
      this.taskBusy.set(false);
    }
  }

  startEdit(task: Task): void {
    this.editingTask.set(task);
    this.taskForm.setValue({
      title: task.title,
      description: task.description ?? '',
    });
    this.clearFeedback();
  }

  cancelEdit(): void {
    this.editingTask.set(null);
    this.taskForm.reset({ title: '', description: '' });
    this.clearFeedback();
  }

  async toggleTask(task: Task): Promise<void> {
    if (this.taskBusy()) {
      return;
    }

    this.taskBusy.set(true);

    try {
      await firstValueFrom(
        this.api.updateTask(task.id, {
          completed: !task.completed,
        }),
      );
      await this.reloadTasks();
    } catch (error) {
      this.flashError(this.readError(error));
    } finally {
      this.taskBusy.set(false);
    }
  }

  async deleteTask(task: Task): Promise<void> {
    if (this.taskBusy()) {
      return;
    }

    if (!window.confirm('Delete task?')) {
      return;
    }

    this.taskBusy.set(true);

    try {
      await firstValueFrom(this.api.deleteTask(task.id));
      if (this.editingTask()?.id === task.id) {
        this.cancelEdit();
      }
      await this.reloadTasks();
      this.flashMessage('Deleted');
    } catch (error) {
      this.flashError(this.readError(error));
    } finally {
      this.taskBusy.set(false);
    }
  }

  logout(): void {
    this.session.clear();
    this.clearFeedback();
  }

  private async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authBusy.set(true);
    this.clearFeedback();

    try {
      const payload = {
        username: this.loginForm.controls.username.value.trim(),
        password: this.loginForm.controls.password.value,
      };
      const response = await firstValueFrom(this.api.login(payload));
      this.applySession(response);
      this.loginForm.reset({
        username: payload.username,
        password: '',
      });
      this.flashMessage('Signed in');
    } catch (error) {
      this.flashError(this.readError(error));
    } finally {
      this.authBusy.set(false);
    }
  }

  private async register(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authBusy.set(true);
    this.clearFeedback();

    try {
      const payload = {
        username: this.registerForm.controls.username.value.trim(),
        email: this.registerForm.controls.email.value.trim(),
        password: this.registerForm.controls.password.value,
      };

      await firstValueFrom(this.api.register(payload));
      const response = await firstValueFrom(
        this.api.login({
          username: payload.username,
          password: payload.password,
        }),
      );

      this.applySession(response);
      this.registerForm.reset({
        username: '',
        email: '',
        password: '',
      });
      this.flashMessage('Account created');
    } catch (error) {
      this.flashError(this.readError(error));
    } finally {
      this.authBusy.set(false);
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

  private async syncSession(): Promise<void> {
    if (!this.session.token()) {
      return;
    }

    this.taskBusy.set(true);

    try {
      const user = await firstValueFrom(this.api.me());
      this.session.updateUser(user);
      const tasks = await firstValueFrom(this.api.listTasks());
      this.tasks.set(tasks);
    } catch (error) {
      if (this.session.token()) {
        this.flashError(this.readError(error));
      }
    } finally {
      this.taskBusy.set(false);
    }
  }

  private async reloadTasks(): Promise<void> {
    if (!this.session.token()) {
      return;
    }

    const tasks = await firstValueFrom(this.api.listTasks());
    this.tasks.set(tasks);
  }

  private resetWorkspace(): void {
    this.tasks.set([]);
    this.editingTask.set(null);
    this.taskForm.reset({ title: '', description: '' });
  }

  private clearFeedback(): void {
    this.error.set('');
    this.message.set('');
    if (this.notificationTimer !== null) {
      window.clearTimeout(this.notificationTimer);
      this.notificationTimer = null;
    }
  }

  private flashMessage(text: string): void {
    this.setNotice('message', text);
  }

  private flashError(text: string): void {
    this.setNotice('error', text);
  }

  private setNotice(kind: 'message' | 'error', text: string): void {
    this.clearFeedback();

    if (kind === 'message') {
      this.message.set(text);
    } else {
      this.error.set(text);
    }

    this.notificationTimer = window.setTimeout(() => {
      this.message.set('');
      this.error.set('');
      this.notificationTimer = null;
    }, 2500);
  }

  private normalizeText(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  fieldError(
    control: AbstractControl<string | null, string | null>,
    label: string,
    options: { minLength?: number; maxLength?: number; email?: boolean } = {},
  ): string {
    if (!control.touched || !control.invalid) {
      return '';
    }

    if (control.hasError('required')) {
      return `${label} is required`;
    }

    if (options.email && control.hasError('email')) {
      return 'Enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const requiredLength = control.getError('minlength')?.requiredLength ?? options.minLength;
      if (requiredLength) {
        return `${label} must be at least ${requiredLength} characters`;
      }
    }

    if (control.hasError('maxlength')) {
      const requiredLength = control.getError('maxlength')?.requiredLength ?? options.maxLength;
      if (requiredLength) {
        return `${label} must be ${requiredLength} characters or fewer`;
      }
    }

    return `Check ${label.toLowerCase()}`;
  }

  private readError(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return 'Error';
    }

    const response = error as {
      error?: {
        message?: string;
        details?: string[];
      };
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
}
