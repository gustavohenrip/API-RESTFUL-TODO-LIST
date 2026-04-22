export interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

export interface SessionState {
  accessToken: string;
  expiresAt: string;
  user: User;
}
