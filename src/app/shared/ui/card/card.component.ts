import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ahram-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [ngClass]="['rounded-lg border border-border bg-card text-card-foreground shadow-sm', className()]">
      @if (title()) {
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-2xl font-semibold leading-none tracking-tight font-display">
            {{ title() }}
          </h3>
          @if (description()) {
            <p class="text-sm text-muted-foreground">{{ description() }}</p>
          }
        </div>
      }
      <div class="p-6 pt-0">
        <ng-content />
      </div>
    </div>
  `,
})
export class CardComponent {
  readonly title = input<string>();
  readonly description = input<string>();
  readonly className = input('');
}
