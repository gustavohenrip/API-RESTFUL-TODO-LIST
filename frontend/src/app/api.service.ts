import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  User,
} from './models';
import { API_URL } from './app.tokens';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  register(payload: RegisterPayload) {
    return this.http.post<User>(this.url('/auth/register'), payload);
  }

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(this.url('/auth/login'), payload);
  }

  me() {
    return this.http.get<User>(this.url('/auth/me'));
  }

  listTasks() {
    return this.http.get<Task[]>(this.url('/tasks'));
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
