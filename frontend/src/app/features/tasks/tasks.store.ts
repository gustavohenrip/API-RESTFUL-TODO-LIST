import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { Task, TaskCreatePayload, TaskUpdatePayload } from '../../core/models';

export type TaskFilter = 'all' | 'open' | 'done';

@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly api = inject(ApiService);
  private readonly feedback = inject(FeedbackService);

  private readonly items = signal<Task[]>([]);
  private readonly busyIds = signal(new Set<string>());

  readonly filter = signal<TaskFilter>('all');
  readonly editingTask = signal<Task | null>(null);
  readonly loading = signal(false);
  readonly busy = computed(() => this.busyIds().size > 0);

  readonly tasks = computed(() => this.items());
  readonly visibleTasks = computed(() => {
    const tasks = this.items();
    const filter = this.filter();
    if (filter === 'open') {
      return tasks.filter((task) => !task.completed);
    }
    if (filter === 'done') {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  });

  readonly filterIndex = computed(() => {
    switch (this.filter()) {
      case 'open':
        return 1;
      case 'done':
        return 2;
      default:
        return 0;
    }
  });

  isBusy(id: string): boolean {
    return this.busyIds().has(id);
  }

  reset(): void {
    this.items.set([]);
    this.editingTask.set(null);
    this.filter.set('all');
    this.busyIds.set(new Set());
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.api.listTasks({ size: 200 }));
      this.items.set(response.content);
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
    } finally {
      this.loading.set(false);
    }
  }

  async create(payload: TaskCreatePayload): Promise<boolean> {
    try {
      const created = await firstValueFrom(this.api.createTask(payload));
      this.items.update((tasks) => [created, ...tasks]);
      this.feedback.notify('Added');
      return true;
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
      return false;
    }
  }

  async save(id: string, payload: TaskUpdatePayload): Promise<boolean> {
    this.markBusy(id, true);
    try {
      const updated = await firstValueFrom(this.api.updateTask(id, payload));
      this.items.update((tasks) => tasks.map((task) => (task.id === id ? updated : task)));
      this.feedback.notify('Saved');
      return true;
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
      return false;
    } finally {
      this.markBusy(id, false);
    }
  }

  async toggle(task: Task): Promise<void> {
    this.markBusy(task.id, true);
    try {
      const updated = await firstValueFrom(
        this.api.updateTask(task.id, { completed: !task.completed }),
      );
      this.items.update((tasks) => tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
    } finally {
      this.markBusy(task.id, false);
    }
  }

  async remove(task: Task): Promise<void> {
    this.markBusy(task.id, true);
    try {
      await firstValueFrom(this.api.deleteTask(task.id));
      this.items.update((tasks) => tasks.filter((t) => t.id !== task.id));
      if (this.editingTask()?.id === task.id) {
        this.editingTask.set(null);
      }
      this.feedback.notify('Deleted');
    } catch (error) {
      this.feedback.fail(this.feedback.readError(error));
    } finally {
      this.markBusy(task.id, false);
    }
  }

  private markBusy(id: string, busy: boolean): void {
    this.busyIds.update((current) => {
      const next = new Set(current);
      if (busy) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
