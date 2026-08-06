import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type AnimationType =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade-in'
  | 'scale-in'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right';

let pluginRegistered = false;

@Directive({
  selector: '[ahramAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private scrollTriggerInstance: ScrollTrigger | null = null;

  readonly ahramAnimate = input<AnimationType>('fade-up');
  readonly animateDelay = input(0);
  readonly animateDuration = input(0.55);
  readonly animateDistance = input(35);
  readonly animateStart = input('top 100%');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!pluginRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      pluginRegistered = true;
    }

    afterNextRender(() => {
      this.initAnimation();
    });
  }

  private initAnimation(): void {
    const el = this.el.nativeElement;
    const type = this.ahramAnimate();
    const distance = this.animateDistance();

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      duration: this.animateDuration(),
      delay: this.animateDelay(),
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: this.animateStart(),
        toggleActions: 'play none none none',
      },
    };

    switch (type) {
      case 'fade-up':
        fromVars.y = distance;
        break;
      case 'fade-down':
        fromVars.y = -distance;
        break;
      case 'fade-left':
        fromVars.x = -distance;
        break;
      case 'fade-right':
        fromVars.x = distance;
        break;
      case 'fade-in':
        break;
      case 'scale-in':
        fromVars.scale = 0.85;
        break;
      case 'slide-up':
        fromVars.y = distance * 1.5;
        fromVars.ease = 'power3.out';
        break;
      case 'slide-left':
        fromVars.x = -distance * 1.5;
        fromVars.ease = 'power3.out';
        break;
      case 'slide-right':
        fromVars.x = distance * 1.5;
        fromVars.ease = 'power3.out';
        break;
    }

    const tween = gsap.from(el, { ...fromVars, clearProps: 'all' });
    this.scrollTriggerInstance = tween.scrollTrigger as ScrollTrigger;
  }

  ngOnDestroy(): void {
    this.scrollTriggerInstance?.kill();
  }
}
