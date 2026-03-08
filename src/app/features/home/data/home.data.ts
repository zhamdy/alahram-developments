import { FeaturedProject, Testimonial, ValuePillar } from '../models/home.models';

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'project-865',
    nameKey: 'home.projects.project865.name',
    descriptionKey: 'home.projects.project865.description',
    locationKey: 'home.projects.project865.location',
    statusKey: 'home.projects.project865.status',
    gradientFrom: 'oklch(0.72 0.15 55)',
    gradientTo: 'oklch(0.60 0.12 40)',
    link: '/projects/project-865',
  },
  {
    id: 'project-868',
    nameKey: 'home.projects.project868.name',
    descriptionKey: 'home.projects.project868.description',
    locationKey: 'home.projects.project868.location',
    statusKey: 'home.projects.project868.status',
    gradientFrom: 'oklch(0.25 0.06 50)',
    gradientTo: 'oklch(0.35 0.08 55)',
    link: '/projects/project-868',
  },
  {
    id: 'project-76',
    nameKey: 'home.projects.project76.name',
    descriptionKey: 'home.projects.project76.description',
    locationKey: 'home.projects.project76.location',
    statusKey: 'home.projects.project76.status',
    gradientFrom: 'oklch(0.85 0.18 90)',
    gradientTo: 'oklch(0.72 0.15 55)',
    link: '/projects/project-76',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    nameAr: 'أحمد محمد',
    nameEn: 'Ahmed Mohamed',
    quoteAr: 'تعاملت مع شركة الأهرام وكانت تجربة ممتازة. التزام بالمواعيد وجودة عالية في التشطيب.',
    quoteEn: 'I dealt with Al-Ahram and it was an excellent experience. On-time delivery and high-quality finishing.',
  },
  {
    id: 'testimonial-2',
    nameAr: 'محمد عبد الرحمن',
    nameEn: 'Mohamed Abdelrahman',
    quoteAr: 'من أفضل شركات التطوير العقاري في مدينة السادات. أسعار مناسبة وتسهيلات في السداد.',
    quoteEn: 'One of the best real estate companies in Sadat City. Reasonable prices and flexible payment plans.',
  },
  {
    id: 'testimonial-3',
    nameAr: 'سارة أحمد',
    nameEn: 'Sara Ahmed',
    quoteAr: 'الموقع ممتاز في المنطقة الذهبية والشركة محترمة جداً في التعامل. أنصح الجميع بالتعامل معهم.',
    quoteEn: 'Excellent location in the Golden Zone and the company is very professional. I recommend them to everyone.',
  },
];

export const VALUE_PILLARS: ValuePillar[] = [
  {
    id: 'trust',
    titleKey: 'home.whyUs.trust.title',
    descriptionKey: 'home.whyUs.trust.description',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'transparency',
    titleKey: 'home.whyUs.transparency.title',
    descriptionKey: 'home.whyUs.transparency.description',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
  {
    id: 'execution',
    titleKey: 'home.whyUs.execution.title',
    descriptionKey: 'home.whyUs.execution.description',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    id: 'safety',
    titleKey: 'home.whyUs.safety.title',
    descriptionKey: 'home.whyUs.safety.description',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
];
