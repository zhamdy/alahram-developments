import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'ahram-installment-calculator',
  standalone: true,
  imports: [FormsModule, TranslocoDirective, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './installment-calculator.component.html',
  styleUrl: './installment-calculator.component.scss',
})
export class InstallmentCalculatorComponent {
  readonly defaultPrice = input<number>(1000000);

  protected readonly price = signal(0);
  protected readonly downPaymentPercent = signal(20);
  protected readonly termYears = signal(10);
  protected readonly interestRate = signal(12);

  protected readonly loanAmount = computed(() => {
    const p = this.price();
    const dp = this.downPaymentPercent();
    return p * (1 - dp / 100);
  });

  protected readonly downPaymentAmount = computed(() => {
    return this.price() * (this.downPaymentPercent() / 100);
  });

  protected readonly monthlyPayment = computed(() => {
    const principal = this.loanAmount();
    const rate = this.interestRate() / 100 / 12;
    const n = this.termYears() * 12;

    if (principal <= 0 || n <= 0) return 0;
    if (rate === 0) return principal / n;

    return (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  });

  protected readonly totalAmount = computed(() => {
    return this.monthlyPayment() * this.termYears() * 12;
  });

  protected readonly totalInterest = computed(() => {
    return this.totalAmount() - this.loanAmount();
  });

  ngOnInit(): void {
    this.price.set(this.defaultPrice());
  }

  protected onPriceInput(value: string): void {
    this.price.set(Number(value) || 0);
  }

  protected onDownPaymentInput(value: string): void {
    const v = Math.min(90, Math.max(0, Number(value) || 0));
    this.downPaymentPercent.set(v);
  }

  protected onTermInput(value: string): void {
    const v = Math.min(30, Math.max(1, Number(value) || 1));
    this.termYears.set(v);
  }

  protected onInterestInput(value: string): void {
    const v = Math.min(30, Math.max(0, Number(value) || 0));
    this.interestRate.set(v);
  }
}
