import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SeoService } from '@core/services';

@Component({
  selector: 'ahram-privacy',
  standalone: true,
  imports: [TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.updateSeo({
      title: 'سياسة الخصوصية',
      description: 'سياسة الخصوصية لشركة الأهرام للتطوير العقاري — كيف نجمع ونستخدم ونحمي بياناتك الشخصية',
      keywords: 'سياسة الخصوصية, الأهرام, حماية البيانات, خصوصية',
      canonicalUrl: 'https://alahram-developments.com/privacy',
    });
  }
}
