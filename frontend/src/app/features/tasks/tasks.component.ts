import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';
import { Task } from '../../core/models';
import { TaskFormComponent } from './task-form.component';
import { TaskListComponent } from './task-list.component';
import { TasksStore } from './tasks.store';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  imports: [TaskFormComponent, TaskListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent implements OnInit {
  protected readonly store = inject(TasksStore);
  private readonly confirmService = inject(ConfirmService);

  ngOnInit(): void {
    void this.store.load();
  }

  onEdit(task: Task): void {
    this.store.editingTask.set(task);
  }

  async onRemove(task: Task): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: 'Delete task',
      message: `Delete "${task.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    await this.store.remove(task);
  }
}
