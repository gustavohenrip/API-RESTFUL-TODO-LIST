import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  LoginPayload,
  Page,
  RegisterPayload,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  User,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  register(payload: RegisterPayload) {
    return this.http.post<User>(this.url('/auth/register'), payload);
  }

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(this.url('/auth/login'), payload);
  }

  me() {
    return this.http.get<User>(this.url('/auth/me'));
  }

  listTasks(options: { completed?: boolean; page?: number; size?: number } = {}) {
    let params = new HttpParams();
    if (options.completed !== undefined) {
      params = params.set('completed', String(options.completed));
    }
    if (options.page !== undefined) {
      params = params.set('page', String(options.page));
    }
    if (options.size !== undefined) {
      params = params.set('size', String(options.size));
    }
    return this.http.get<Page<Task>>(this.url('/tasks'), { params });
  }

  createTask(payload: TaskCreatePayload) {
    return this.http.post<Task>(this.url('/tasks'), payload);
  }

  updateTask(taskId: string, payload: TaskUpdatePayload) {
    return this.http.put<Task>(this.url(`/tasks/${taskId}`), payload);
  }

  deleteTask(taskId: string) {
    return this.http.delete<void>(this.url(`/tasks/${taskId}`));
  }

  private url(path: string) {
    return `${this.apiUrl}${path}`;
  }
}
