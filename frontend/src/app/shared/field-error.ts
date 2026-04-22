import { AbstractControl } from '@angular/forms';

export interface FieldErrorOptions {
  minLength?: number;
  maxLength?: number;
  email?: boolean;
}

export function fieldError(
  control: AbstractControl<string | null, string | null>,
  label: string,
  options: FieldErrorOptions = {},
): string {
  if (!control.touched || !control.invalid) {
    return '';
  }

  if (control.hasError('required')) {
    return `${label} is required`;
  }

  if (options.email && control.hasError('email')) {
    return 'Enter a valid email address';
  }

  if (control.hasError('minlength')) {
    const requiredLength = control.getError('minlength')?.requiredLength ?? options.minLength;
    if (requiredLength) {
      return `${label} must be at least ${requiredLength} characters`;
    }
  }

  if (control.hasError('maxlength')) {
    const requiredLength = control.getError('maxlength')?.requiredLength ?? options.maxLength;
    if (requiredLength) {
      return `${label} must be ${requiredLength} characters or fewer`;
    }
  }

  return `Check ${label.toLowerCase()}`;
}
