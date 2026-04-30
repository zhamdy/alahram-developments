import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ScrollAnimateDirective } from '@shared/directives';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'ahram-trust-bar',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trust-bar.component.html',
  styleUrl: './trust-bar.component.scss',
})
export class TrustBarComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private scrollTrigger?: ScrollTrigger;
  private tweens: gsap.core.Tween[] = [];

  protected readonly projectsCount = signal(0);
  protected readonly unitsCount = signal(0);
  protected readonly clientsCount = signal(0);

  protected readonly stats = [
    { target: 21,  signal: this.projectsCount, labelKey: 'home.trustBar.projects', suffix: '' },
    { target: 300, signal: this.unitsCount,    labelKey: 'home.trustBar.units',    suffix: '+' },
    { target: 260, signal: this.clientsCount,  labelKey: 'about.stats.clients',    suffix: '+' },
  ];

  constructor() {
    afterNextRender(() => { this.initCountUp(); });
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.tweens.forEach(t => t.kill());
  }

  private initCountUp(): void {
    const section = this.elementRef.nativeElement.querySelector('section');
    if (!section) return;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        this.stats.forEach((stat) => {
          const obj = { val: 0 };
          const tween = gsap.to(obj, {
            duration: 2.5,
            val: stat.target,
            ease: 'power3.out',
            onUpdate: () => { stat.signal.set(Math.floor(obj.val)); },
          });
          this.tweens.push(tween);
        });
      },
    });
  }
}
