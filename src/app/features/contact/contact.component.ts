import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService, PlatformService } from '@core/services';
import { ContactFormComponent } from '@shared/ui';

@Component({
  selector: 'ahram-contact',
  standalone: true,
  imports: [TranslocoDirective, ContactFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly platform = inject(PlatformService);

  ngOnInit(): void {
    this.seo.updateSeo({
      title: 'تواصل معنا',
      description: 'تواصل مع شركة الأهرام للتطوير العقاري — اتصل بنا أو أرسل رسالة عبر واتساب أو النموذج الإلكتروني',
      keywords: 'تواصل, الأهرام, تطوير عقاري, مدينة السادات, اتصل بنا',
      canonicalUrl: 'https://alahram-developments.com/contact',
    });
  }
}
