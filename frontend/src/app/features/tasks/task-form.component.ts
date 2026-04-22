import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { fieldError } from '../../shared/field-error';
import { TasksStore } from './tasks.store';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly store = inject(TasksStore);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  readonly submitting = signal(false);
  readonly editing = computed(() => this.store.editingTask());

  readonly fieldError = fieldError;

  constructor() {
    effect(() => {
      const task = this.store.editingTask();
      if (task) {
        this.form.setValue({ title: task.title, description: task.description ?? '' });
      } else {
        this.form.reset({ title: '', description: '' });
      }
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const title = this.form.controls.title.value.trim();
    const description = this.normalize(this.form.controls.description.value);

    this.submitting.set(true);
    const editing = this.store.editingTask();
    try {
      let ok = false;
      if (editing) {
        ok = await this.store.save(editing.id, {
          title,
          description,
          completed: editing.completed,
        });
      } else {
        ok = await this.store.create({ title, description });
      }
      if (ok) {
        this.store.editingTask.set(null);
        this.form.reset({ title: '', description: '' });
      }
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.store.editingTask.set(null);
    this.form.reset({ title: '', description: '' });
  }

  private normalize(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
