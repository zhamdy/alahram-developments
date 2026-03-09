export interface ConstructionUpdate {
  readonly id: string;
  readonly projectSlug: string;
  readonly projectNameKey: string;
  readonly date: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly milestone: 'foundation' | 'structure' | 'finishing' | 'delivery';
  readonly imageUrl: string;
}

export const MILESTONES = ['foundation', 'structure', 'finishing', 'delivery'] as const;

export const CONSTRUCTION_UPDATES: readonly ConstructionUpdate[] = [
  {
    id: 'update-1',
    projectSlug: 'project-865',
    projectNameKey: 'projects.project865.name',
    date: '2026-03-01',
    titleKey: 'constructionUpdates.updates.update1.title',
    descriptionKey: 'constructionUpdates.updates.update1.description',
    milestone: 'finishing',
    imageUrl: 'assets/images/projects/project-865-gallery-1.jpg',
  },
  {
    id: 'update-2',
    projectSlug: 'project-868',
    projectNameKey: 'projects.project868.name',
    date: '2026-02-15',
    titleKey: 'constructionUpdates.updates.update2.title',
    descriptionKey: 'constructionUpdates.updates.update2.description',
    milestone: 'structure',
    imageUrl: 'assets/images/projects/project-868-gallery-1.jpg',
  },
  {
    id: 'update-3',
    projectSlug: 'project-865',
    projectNameKey: 'projects.project865.name',
    date: '2026-01-20',
    titleKey: 'constructionUpdates.updates.update3.title',
    descriptionKey: 'constructionUpdates.updates.update3.description',
    milestone: 'structure',
    imageUrl: 'assets/images/projects/project-865-gallery-2.jpg',
  },
  {
    id: 'update-4',
    projectSlug: 'project-76',
    projectNameKey: 'projects.project76.name',
    date: '2026-01-10',
    titleKey: 'constructionUpdates.updates.update4.title',
    descriptionKey: 'constructionUpdates.updates.update4.description',
    milestone: 'foundation',
    imageUrl: 'assets/images/projects/project-76-gallery-1.jpg',
  },
  {
    id: 'update-5',
    projectSlug: 'project-868',
    projectNameKey: 'projects.project868.name',
    date: '2025-12-15',
    titleKey: 'constructionUpdates.updates.update5.title',
    descriptionKey: 'constructionUpdates.updates.update5.description',
    milestone: 'foundation',
    imageUrl: 'assets/images/projects/project-868-gallery-2.jpg',
  },
];
