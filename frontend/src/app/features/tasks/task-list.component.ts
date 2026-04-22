import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Task } from '../../core/models';
import { TaskItemComponent } from './task-item.component';
import { TaskFilter, TasksStore } from './tasks.store';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  imports: [TaskItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  protected readonly store = inject(TasksStore);

  readonly edit = output<Task>();
  readonly remove = output<Task>();

  setFilter(filter: TaskFilter): void {
    this.store.filter.set(filter);
  }
}
