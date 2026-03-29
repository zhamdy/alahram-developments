import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LucideMapPin, LucidePhone, LucideMessageCircle, LucideMail } from '@lucide/angular';
import { SOCIAL_LINKS } from '../../../core/config/social.config';
import { LocalizeRoutePipe } from '@shared/pipes';
import { NewsletterComponent } from '@shared/ui';

@Component({
  selector: 'ahram-footer',
  standalone: true,
  imports: [RouterLink, TranslocoDirective, NgOptimizedImage, LocalizeRoutePipe, NewsletterComponent, LucideMapPin, LucidePhone, LucideMessageCircle, LucideMail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();
  protected readonly social = SOCIAL_LINKS;
}
