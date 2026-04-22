import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FeedbackService } from './core/feedback.service';
import { SessionService } from './core/session.service';
import { TasksStore } from './features/tasks/tasks.store';
import { ConfirmModalComponent } from './shared/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly session = inject(SessionService);
  private readonly store = inject(TasksStore);
  private readonly router = inject(Router);
  protected readonly feedback = inject(FeedbackService);

  readonly signedIn = computed(() => Boolean(this.session.token()));

  async logout(): Promise<void> {
    this.session.clear();
    this.store.reset();
    this.feedback.clear();
    await this.router.navigate(['/login']);
  }
}
