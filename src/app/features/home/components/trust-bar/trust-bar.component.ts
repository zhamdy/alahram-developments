import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { Building2, Home, Users, LucideIcon } from '@lucide/angular';
import { ScrollAnimateDirective } from '@shared/directives';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'ahram-trust-bar',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective, Building2, Home, Users],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trust-bar.component.html',
  styleUrl: './trust-bar.component.scss',
})
export class TrustBarComponent {
  private readonly elementRef = inject(ElementRef);

  protected readonly projectsCount = signal(0);
  protected readonly unitsCount = signal(0);
  protected readonly clientsCount = signal(0);

  protected readonly stats = [
    {
      target: 21,
      signal: this.projectsCount,
      icon: Building2,
      labelKey: 'home.trustBar.projects',
      suffix: '',
    },
    {
      target: 300,
      signal: this.unitsCount,
      icon: Home,
      labelKey: 'home.trustBar.units',
      suffix: '+',
    },
    {
      target: 260,
      signal: this.clientsCount,
      icon: Users,
      labelKey: 'about.stats.clients',
      suffix: '+',
    },
  ];

  constructor() {
    afterNextRender(() => {
      this.initCountUp();
    });
  }

  private initCountUp(): void {
    const section = this.elementRef.nativeElement.querySelector('section');
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        this.stats.forEach((stat) => {
          const obj = { val: 0 };
          gsap.to(obj, {
            duration: 2.5,
            val: stat.target,
            ease: 'power3.out',
            onUpdate: () => {
              stat.signal.set(Math.floor(obj.val));
            },
          });
        });
      },
    });
  }
}
