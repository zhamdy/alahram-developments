import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'ahram-faq-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-accordion.component.html',
})
export class FaqAccordionComponent {
  readonly items = input<{ question: string; answer: string }[]>([]);

  protected readonly openIndex = signal<number | null>(null);

  toggle(index: number): void {
    this.openIndex.update(current => (current === index ? null : index));
  }
}
