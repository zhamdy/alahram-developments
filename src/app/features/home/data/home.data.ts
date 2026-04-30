import {
  LucideShieldCheck,
  LucideEye,
  LucideTag,
  LucideHouse,
  LucideGraduationCap,
  LucideTrees,
  LucideTrainFront,
  LucideShoppingBag,
} from '@lucide/angular';
import { BrandStoryHighlight, FeaturedProject, LifestyleAmenity, MosaicTile, Testimonial, ValuePillar } from '../models/home.models';

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

export const BRAND_STORY_HIGHLIGHTS: BrandStoryHighlight[] = [
  { valueKey: 'home.brandStory.highlights.founded.value', labelKey: 'home.brandStory.highlights.founded.label' },
  { valueKey: 'home.brandStory.highlights.city.value', labelKey: 'home.brandStory.highlights.city.label' },
  { valueKey: 'home.brandStory.highlights.mission.value', labelKey: 'home.brandStory.highlights.mission.label' },
];

export const MOSAIC_TILES: MosaicTile[] = [
  {
    id: 'project-29',
    imageUrl: 'assets/images/projects/project-29-hero.jpg',
    nameKey: 'home.mosaic.project29',
    link: '/projects/zone-7-homeland/project-29',
    tileSize: 'lg',
  },
  {
    id: 'project-255',
    imageUrl: 'assets/images/projects/project-255-hero.jpg',
    nameKey: 'home.mosaic.project255',
    link: '/projects/zone-7-strip/project-255',
    tileSize: 'md',
  },
  {
    id: 'project-336',
    imageUrl: 'assets/images/projects/project-336-hero.jpg',
    nameKey: 'home.mosaic.project336',
    link: '/projects/zone-14/project-336',
    tileSize: 'sm',
  },
  {
    id: 'project-348',
    imageUrl: 'assets/images/projects/project-348-hero.jpg',
    nameKey: 'home.mosaic.project348',
    link: '/projects/zone-14/project-348',
    tileSize: 'sm',
  },
  {
    id: 'project-584',
    imageUrl: 'assets/images/projects/project-584-hero.jpg',
    nameKey: 'home.mosaic.project584',
    link: '/projects/zone-21/project-584',
    tileSize: 'md',
  },
  {
    id: 'project-629',
    imageUrl: 'assets/images/projects/project-629-hero.jpg',
    nameKey: 'home.mosaic.project629',
    link: '/projects/zone-21/project-629',
    tileSize: 'sm',
  },
  {
    id: 'project-137',
    imageUrl: 'assets/images/projects/project-137-hero.jpg',
    nameKey: 'home.mosaic.project137',
    link: '/projects/zone-35/project-137',
    tileSize: 'sm',
  },
];

export const LIFESTYLE_AMENITIES: LifestyleAmenity[] = [
  {
    id: 'schools',
    titleKey: 'home.lifestyle.schools.title',
    descriptionKey: 'home.lifestyle.schools.description',
    icon: LucideGraduationCap.icon,
  },
  {
    id: 'parks',
    titleKey: 'home.lifestyle.parks.title',
    descriptionKey: 'home.lifestyle.parks.description',
    icon: LucideTrees.icon,
  },
  {
    id: 'transit',
    titleKey: 'home.lifestyle.transit.title',
    descriptionKey: 'home.lifestyle.transit.description',
    icon: LucideTrainFront.icon,
  },
  {
    id: 'security',
    titleKey: 'home.lifestyle.security.title',
    descriptionKey: 'home.lifestyle.security.description',
    icon: LucideShieldCheck.icon,
  },
  {
    id: 'retail',
    titleKey: 'home.lifestyle.retail.title',
    descriptionKey: 'home.lifestyle.retail.description',
    icon: LucideShoppingBag.icon,
  },
];
