import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Task } from '../../core/models';
import { TasksStore } from './tasks.store';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItemComponent {
  readonly task = input.required<Task>();
  readonly index = input.required<number>();
  readonly edit = output<Task>();
  readonly remove = output<Task>();

  protected readonly store = inject(TasksStore);

  toggle(): void {
    void this.store.toggle(this.task());
  }
}
