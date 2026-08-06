import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomValidators {
  static egyptianPhone(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const pattern = /^(\+20|0)?1[0125]\d{8}$/;
    return pattern.test(control.value) ? null : { egyptianPhone: true };
  }

  static egyptianNationalId(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const pattern = /^\d{14}$/;
    return pattern.test(control.value) ? null : { egyptianNationalId: true };
  }

  static matchField(fieldName: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) return null;
      const fieldToMatch = parent.get(fieldName);
      if (!fieldToMatch) return null;
      return control.value === fieldToMatch.value ? null : { mismatch: true };
    };
  }

  static minAge(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= minAge ? null : { minAge: { required: minAge, actual: age } };
    };
  }

  static noWhitespace(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isWhitespace = control.value.trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }
}
