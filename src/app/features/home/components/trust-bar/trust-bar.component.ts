import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, linkedSignal, OnDestroy, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideBuilding2, LucideHome, LucideUsers } from '@lucide/angular';
import { SiteSettingsService } from '@core/services';
import { ScrollAnimateDirective } from '@shared/directives';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'ahram-trust-bar',
  standalone: true,
  imports: [TranslocoDirective, ScrollAnimateDirective, LucideBuilding2, LucideHome, LucideUsers],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trust-bar.component.html',
  styleUrl: './trust-bar.component.scss',
})
export class TrustBarComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly siteSettings = inject(SiteSettingsService);
  private scrollTrigger?: ScrollTrigger;
  private tweens: gsap.core.Tween[] = [];

  // The real figures, rendered on the server and in every client render. Nothing
  // ever writes 0 here: a JS-rendering crawler hydrates without scrolling, so a
  // placeholder would end up in the rendered DOM even if no human saw it.
  protected readonly projectsCount = linkedSignal(() => this.siteSettings.settings().projectsCount);
  protected readonly unitsCount = linkedSignal(() => this.siteSettings.settings().unitsCount);
  protected readonly clientsCount = linkedSignal(() => this.siteSettings.settings().clientsCount);

  // Decorative count-up, client-only and aria-hidden. Null means "not animating",
  // which is the state the server and the first client render always produce.
  protected readonly animatedCounts = signal<number[] | null>(null);

  protected readonly stats = computed(() => {
    const s = this.siteSettings.settings();
    return [
      { target: s.projectsCount, signal: this.projectsCount, labelKey: 'home.trustBar.projects', suffix: '' },
      { target: s.unitsCount,    signal: this.unitsCount,    labelKey: 'home.trustBar.units',    suffix: '+' },
      { target: s.clientsCount,  signal: this.clientsCount,  labelKey: 'about.stats.clients',    suffix: '+' },
    ];
  });

  constructor() {
    afterNextRender(() => {
      this.initCountUp();
    });
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.tweens.forEach(t => t.kill());
  }

  private initCountUp(): void {
    const section = this.elementRef.nativeElement.querySelector('section');
    if (!section) return;

    // The overlay starts at 0, so it may only appear while the bar is off-screen —
    // otherwise the figure would visibly count backwards from its real value.
    if (this.prefersReducedMotion() || this.isInViewport(section)) return;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const targets = this.stats().map(stat => stat.target);
        this.animatedCounts.set(targets.map(() => 0));

        targets.forEach((target, index) => {
          const obj = { val: 0 };
          const tween = gsap.to(obj, {
            duration: 2.5,
            val: target,
            ease: 'power3.out',
            onUpdate: () => {
              const current = this.animatedCounts();
              if (!current) return;
              const next = [...current];
              next[index] = Math.floor(obj.val);
              this.animatedCounts.set(next);
            },
          });
          this.tweens.push(tween);
        });

        // Drop the overlay once the tweens land, so the real figures are the only
        // numbers in the DOM again.
        this.tweens.push(gsap.delayedCall(2.5, () => this.animatedCounts.set(null)));
      },
    });
  }

  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
