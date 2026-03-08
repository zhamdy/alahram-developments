import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ahram-input',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2">
      @if (label()) {
        <label [for]="inputId()" class="text-sm font-medium leading-none">
          {{ label() }}
          @if (required()) {
            <span class="text-destructive">*</span>
          }
        </label>
      }
      <input
        [id]="inputId()"
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [value]="value()"
        [ngClass]="[
          'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error() ? 'border-destructive' : 'border-input'
        ]"
        (input)="onInput($event)"
        (blur)="blurred.emit()"
      />
      @if (error()) {
        <p class="text-sm text-destructive">{{ error() }}</p>
      }
    </div>
  `,
})
export class InputComponent {
  readonly inputId = input('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'url'>('text');
  readonly label = input<string>();
  readonly placeholder = input('');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly error = input<string>();
  readonly value = input('');

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
