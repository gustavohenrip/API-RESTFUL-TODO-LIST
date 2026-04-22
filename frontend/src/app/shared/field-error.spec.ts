import { FormControl, Validators } from '@angular/forms';
import { fieldError } from './field-error';

describe('fieldError', () => {
  it('returns empty string when untouched', () => {
    const control = new FormControl('', Validators.required);
    expect(fieldError(control, 'Username')).toBe('');
  });

  it('reports required error', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    expect(fieldError(control, 'Username')).toBe('Username is required');
  });

  it('reports minlength error with requiredLength', () => {
    const control = new FormControl('ab', [Validators.required, Validators.minLength(3)]);
    control.markAsTouched();
    expect(fieldError(control, 'Username', { minLength: 3 })).toBe(
      'Username must be at least 3 characters',
    );
  });

  it('reports email error when options.email is set', () => {
    const control = new FormControl('not-an-email', [Validators.required, Validators.email]);
    control.markAsTouched();
    expect(fieldError(control, 'Email', { email: true })).toBe('Enter a valid email address');
  });
});
