import { orderBy } from 'firebase/firestore';
import type {
  CompanySettings,
  Material,
  PortfolioProject,
  PublishedProduct,
  SampleRoom,
  TeamMember,
  Testimonial,
} from '../../../types';
import { emptyCompanySettings } from '../constants';
import type { UserIdentity } from '../firestore';
import {
  createDocument,
  fetchDocument,
  patchDocument,
  removeDocument,
  subscribeCollection,
  subscribeDocument,
} from '../firestore';

export function subscribePublishedProducts(
  onData: (products: PublishedProduct[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<PublishedProduct>(
    'publishedProducts',
    [orderBy('name', 'asc')],
    (products) =>
      onData(
        products.slice().sort(
          (left, right) =>
            (left.website?.featuredOrder ?? 999) - (right.website?.featuredOrder ?? 999),
        ),
      ),
    (error) => {
      console.error('Failed to subscribe to published products:', error);
      onError?.('Unable to load the published collection right now.');
    },
  );
}

export function subscribeMaterials(onData: (materials: Material[]) => void, onError?: (message: string) => void) {
  return subscribeCollection<Material>(
    'materials',
    [orderBy('name', 'asc')],
    (materials) =>
      onData(
        materials
          .filter((material) => material.visibleOnSite !== false)
          .slice()
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to materials:', error);
      onError?.('Unable to load the material library right now.');
    },
  );
}

export function subscribeAdminMaterials(
  onData: (materials: Material[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Material>(
    'materials',
    [orderBy('name', 'asc')],
    (materials) =>
      onData(
        materials.slice().sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to admin materials:', error);
      onError?.('Unable to load the full material library right now.');
    },
  );
}

export function subscribeSampleRooms(
  onData: (rooms: SampleRoom[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<SampleRoom>(
    'sampleRooms',
    [orderBy('name', 'asc')],
    (rooms) =>
      onData(
        rooms
          .filter((room) => room.visibleOnSite !== false)
          .slice()
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to sample rooms:', error);
      onError?.('Unable to load the sample rooms right now.');
    },
  );
}

export function subscribeAdminSampleRooms(
  onData: (rooms: SampleRoom[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<SampleRoom>(
    'sampleRooms',
    [orderBy('name', 'asc')],
    (rooms) =>
      onData(rooms.slice().sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999))),
    (error) => {
      console.error('Failed to subscribe to admin sample rooms:', error);
      onError?.('Unable to load the full sample room library right now.');
    },
  );
}

export function subscribeTestimonials(
  onData: (testimonials: Testimonial[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Testimonial>(
    'testimonials',
    [orderBy('clientName', 'asc')],
    (testimonials) =>
      onData(
        testimonials
          .filter((testimonial) => testimonial.visibleOnSite !== false)
          .slice()
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to testimonials:', error);
      onError?.('Unable to load testimonials right now.');
    },
  );
}

export function subscribeAdminTestimonials(
  onData: (testimonials: Testimonial[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Testimonial>(
    'testimonials',
    [orderBy('clientName', 'asc')],
    (testimonials) =>
      onData(
        testimonials
          .slice()
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to admin testimonials:', error);
      onError?.('Unable to load the testimonial library right now.');
    },
  );
}

export function subscribePortfolioProjects(
  onData: (projects: PortfolioProject[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<PortfolioProject>(
    'portfolioProjects',
    [orderBy('title', 'asc')],
    (projects) =>
      onData(
        projects
          .filter((project) => project.visibleOnSite !== false)
          .slice()
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to portfolio projects:', error);
      onError?.('Unable to load the portfolio right now.');
    },
  );
}

export function subscribeAdminPortfolioProjects(
  onData: (projects: PortfolioProject[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<PortfolioProject>(
    'portfolioProjects',
    [orderBy('title', 'asc')],
    (projects) =>
      onData(
        projects
          .slice()
          .sort((left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)),
      ),
    (error) => {
      console.error('Failed to subscribe to admin portfolio projects:', error);
      onError?.('Unable to load the full portfolio library right now.');
    },
  );
}

export function subscribePublicTeamProfiles(
  onData: (profiles: TeamMember[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<TeamMember>(
    'teamProfiles',
    [orderBy('name', 'asc')],
    (profiles) => onData(profiles.filter((profile) => profile.isPublicProfile !== false)),
    (error) => {
      console.error('Failed to subscribe to public team profiles:', error);
      onError?.('Unable to load the studio team right now.');
    },
  );
}

export async function updateMaterial(materialId: string, patch: Partial<Material>, user?: UserIdentity | null) {
  await patchDocument<Material>('materials', materialId, patch, user);
}

export async function createMaterial(material: Material, user?: UserIdentity | null) {
  await createDocument('materials', material.id, material, user);
}

export async function deleteMaterial(materialId: string) {
  await removeDocument('materials', materialId);
}

export async function updateSampleRoom(
  roomId: string,
  patch: Partial<SampleRoom>,
  user?: UserIdentity | null,
) {
  await patchDocument<SampleRoom>('sampleRooms', roomId, patch, user);
}

export async function createSampleRoom(room: SampleRoom, user?: UserIdentity | null) {
  await createDocument('sampleRooms', room.id, room, user);
}

export async function deleteSampleRoom(roomId: string) {
  await removeDocument('sampleRooms', roomId);
}

export async function updateTestimonial(
  testimonialId: string,
  patch: Partial<Testimonial>,
  user?: UserIdentity | null,
) {
  await patchDocument<Testimonial>('testimonials', testimonialId, patch, user);
}

export async function createTestimonial(
  testimonial: Testimonial,
  user?: UserIdentity | null,
) {
  await createDocument('testimonials', testimonial.id, testimonial, user);
}

export async function deleteTestimonial(testimonialId: string) {
  await removeDocument('testimonials', testimonialId);
}

export async function updatePortfolioProject(
  projectId: string,
  patch: Partial<PortfolioProject>,
  user?: UserIdentity | null,
) {
  await patchDocument<PortfolioProject>('portfolioProjects', projectId, patch, user);
}

export async function createPortfolioProject(
  project: PortfolioProject,
  user?: UserIdentity | null,
) {
  await createDocument('portfolioProjects', project.id, project, user);
}

export async function deletePortfolioProject(projectId: string) {
  await removeDocument('portfolioProjects', projectId);
}

export async function fetchCompanySettings() {
  return (await fetchDocument<CompanySettings>('settings', 'companyProfile')) ?? emptyCompanySettings;
}

export function subscribeCompanySettings(
  onData: (settings: CompanySettings) => void,
  onError?: (message: string) => void,
) {
  return subscribeDocument<CompanySettings>(
    'settings',
    'companyProfile',
    (company) => {
      onData(company ?? emptyCompanySettings);
    },
    (error) => {
      console.error('Failed to subscribe to company settings:', error);
      onError?.('Unable to load company settings right now.');
    },
  );
}
