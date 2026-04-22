import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  protected readonly confirmService = inject(ConfirmService);

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirmService.cancel();
    }
  }
}
