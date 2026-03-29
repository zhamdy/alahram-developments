import { LucideShieldCheck, LucideEye, LucideTag, LucideHouse } from '@lucide/angular';
import { FeaturedProject, Testimonial, ValuePillar } from '../models/home.models';

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'project-865',
    nameKey: 'home.projects.project865.name',
    descriptionKey: 'home.projects.project865.description',
    locationKey: 'home.projects.project865.location',
    statusKey: 'home.projects.project865.status',
    imageUrl: 'assets/images/projects/project-865-hero.webp',
    link: '/projects/zone-21/project-865',
  },
  {
    id: 'project-868',
    nameKey: 'home.projects.project868.name',
    descriptionKey: 'home.projects.project868.description',
    locationKey: 'home.projects.project868.location',
    statusKey: 'home.projects.project868.status',
    imageUrl: 'assets/images/projects/project-868-hero.webp',
    link: '/projects/zone-21/project-868',
  },
  {
    id: 'project-76',
    nameKey: 'home.projects.project76.name',
    descriptionKey: 'home.projects.project76.description',
    locationKey: 'home.projects.project76.location',
    statusKey: 'home.projects.project76.status',
    imageUrl: 'assets/images/projects/project-76-hero.webp',
    link: '/projects/al-rawda/project-76',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    nameAr: 'أحمد محمد',
    nameEn: 'Ahmed Mohamed',
    quoteAr: 'تعاملت مع شركة الأهرام وكانت تجربة ممتازة. التزام بالمواعيد وجودة عالية في التشطيب.',
    quoteEn:
      'I dealt with Al-Ahram and it was an excellent experience. On-time delivery and high-quality finishing.',
  },
  {
    id: 'testimonial-2',
    nameAr: 'محمد عبد الرحمن',
    nameEn: 'Mohamed Abdelrahman',
    quoteAr: 'من أفضل شركات التطوير العقاري في مدينة السادات. أسعار مناسبة وتسهيلات في السداد.',
    quoteEn:
      'One of the best real estate companies in Sadat City. Reasonable prices and flexible payment plans.',
  },
  {
    id: 'testimonial-3',
    nameAr: 'سارة أحمد',
    nameEn: 'Sara Ahmed',
    quoteAr:
      'الموقع ممتاز في المنطقة الذهبية والشركة محترمة جداً في التعامل. أنصح الجميع بالتعامل معهم.',
    quoteEn:
      'Excellent location in the Golden Zone and the company is very professional. I recommend them to everyone.',
  },
];

export const VALUE_PILLARS: ValuePillar[] = [
  {
    id: 'trust',
    titleKey: 'home.whyUs.trust.title',
    descriptionKey: 'home.whyUs.trust.description',
    icon: LucideShieldCheck.icon,
  },
  {
    id: 'transparency',
    titleKey: 'home.whyUs.transparency.title',
    descriptionKey: 'home.whyUs.transparency.description',
    icon: LucideEye.icon,
  },
  {
    id: 'pricing',
    titleKey: 'home.whyUs.pricing.title',
    descriptionKey: 'home.whyUs.pricing.description',
    icon: LucideTag.icon,
  },
  {
    id: 'safety',
    titleKey: 'home.whyUs.safety.title',
    descriptionKey: 'home.whyUs.safety.description',
    icon: LucideHouse.icon,
  },
];
