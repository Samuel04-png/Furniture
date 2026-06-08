import { asset } from '../config/site';
import type { CompanySettings, WebsiteMediaItem, WebsiteMediaSlot } from '../types';

type WebsiteMediaDefinition = Omit<
  WebsiteMediaItem,
  'imagePath' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export const websiteMediaSlots: WebsiteMediaSlot[] = [
  'homeHeroPoster',
  'homeSignatureFeature',
  'aboutHero',
  'collectionsHero',
  'materialsHero',
  'contactHero',
  'bookConsultationHero',
  'theProcessHero',
  'configuratorHero',
  'configuratorConfirmationHero',
  'notFoundHero',
];

export const websiteMediaDefinitions: Record<WebsiteMediaSlot, WebsiteMediaDefinition> = {
  homeHeroPoster: {
    slot: 'homeHeroPoster',
    label: 'Homepage hero poster',
    pagePath: '/',
    image: asset(
      'bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (1).jpg',
    ),
    alt: 'Tailored Manor workshop bedroom scene used as the homepage hero poster.',
    description:
      'Fallback poster image for the homepage hero video, preserving the crafted bedroom mood before motion starts.',
    story:
      'This image is the still frame that introduces the brand before the workshop video begins, so it needs to feel warm, premium, and unmistakably Tailored Manor.',
  },
  homeSignatureFeature: {
    slot: 'homeSignatureFeature',
    label: 'Homepage signature feature',
    pagePath: '/',
    image: asset(
      'bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (4).jpg',
    ),
    alt: 'Bedroom furniture styled as the homepage signature service feature image.',
    description:
      'Editorial support image for the homepage section about Tailored Manor’s room-first service philosophy.',
    story:
      'This image should carry the feeling of a finished room, not just a product shot, because it sits beside the studio’s service promise.',
  },
  aboutHero: {
    slot: 'aboutHero',
    label: 'About page hero',
    pagePath: '/about',
    image: asset(
      'bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (7).jpg',
    ),
    alt: 'Crafted bedroom scene used on the About page hero.',
    description:
      'Hero image for the brand story page, grounding the studio in warmth, craft, and restraint.',
    story:
      'The About page needs an image that feels composed and timeless because it frames the studio identity rather than a single product launch.',
  },
  collectionsHero: {
    slot: 'collectionsHero',
    label: 'Collections page hero',
    pagePath: '/collections',
    image: asset(
      'Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe (1).jpg',
    ),
    alt: 'Luxury seating scene used as the collections page hero.',
    description: 'Lead editorial image for the collections catalogue.',
    story:
      'This hero sets the tone for browsing, so it should feel like an interiors editorial cover rather than a retail thumbnail.',
  },
  materialsHero: {
    slot: 'materialsHero',
    label: 'Materials page hero',
    pagePath: '/materials',
    image: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (4).jpg',
    ),
    alt: 'Warm dining furniture scene used on the materials page.',
    description:
      'Hero image for the material library, giving the timber story a lived-in interior context.',
    story:
      'The materials page speaks about wood, finish, and warmth, so the opening image needs to suggest touch, grain, and everyday use.',
  },
  contactHero: {
    slot: 'contactHero',
    label: 'Contact page hero',
    pagePath: '/contact',
    image: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (4).jpg',
    ),
    alt: 'Dining interior used on the contact page hero.',
    description: 'Welcoming hero image for the studio contact page.',
    story:
      'This image should feel inviting and polished because it frames the first direct conversation with the brand.',
  },
  bookConsultationHero: {
    slot: 'bookConsultationHero',
    label: 'Consultation page hero',
    pagePath: '/book-consultation',
    image: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (1).jpg',
    ),
    alt: 'Dining scene used on the book consultation page hero.',
    description: 'Hero image for the consultation booking page.',
    story:
      'This image needs to promise thoughtful guidance and tailored decision-making because it introduces the booking flow.',
  },
  theProcessHero: {
    slot: 'theProcessHero',
    label: 'Process page hero',
    pagePath: '/the-process',
    image: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (3).jpg',
    ),
    alt: 'Dining installation image used on the Tailored Manor process page.',
    description:
      'Hero image for the process page that explains the Tailored Manor method.',
    story:
      'The process page benefits from a calm, assured opening image because it is about trust, flow, and confidence rather than urgency.',
  },
  configuratorHero: {
    slot: 'configuratorHero',
    label: 'Configurator hero',
    pagePath: '/configure',
    image: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (2).jpg',
    ),
    alt: 'Dining room image used as the configurator hero.',
    description: 'Primary hero image for the furniture configurator flow.',
    story:
      'This image needs to feel grounded in real interiors because it introduces a guided quote journey, not a generic ecommerce checkout.',
  },
  configuratorConfirmationHero: {
    slot: 'configuratorConfirmationHero',
    label: 'Configurator confirmation hero',
    pagePath: '/configure/confirmation',
    image: asset(
      'ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (1).jpg',
    ),
    alt: 'Confirmation-state dining room image used after a configurator submission.',
    description: 'Success-state hero image after a configurator quote request is sent.',
    story:
      'The confirmation step should feel reassuring and complete, so the image needs to reinforce calm, trust, and polished delivery.',
  },
  notFoundHero: {
    slot: 'notFoundHero',
    label: 'Not found page hero',
    pagePath: '/404',
    image: asset(
      'full bedroom setup/Crafted with durable, quality wood and styled with a clean, modern finish. This full bedroom se (4).jpg',
    ),
    alt: 'Bedroom scene used on the 404 page.',
    description: 'Fallback hero image for unknown routes.',
    story:
      'Even the 404 page should still feel on-brand, so this image keeps the experience elegant instead of abrupt.',
  },
};

export function getWebsiteMediaItem(settings: CompanySettings, slot: WebsiteMediaSlot): WebsiteMediaItem {
  const fallback = websiteMediaDefinitions[slot];
  const stored = settings.websiteMedia?.[slot];

  return {
    ...fallback,
    ...stored,
    slot,
    image: stored?.image || fallback.image,
    alt: stored?.alt || fallback.alt,
    description: stored?.description || fallback.description,
    story: stored?.story || fallback.story,
    label: stored?.label || fallback.label,
    pagePath: stored?.pagePath || fallback.pagePath,
  };
}

export function getWebsiteMediaLibrary(settings: CompanySettings) {
  return websiteMediaSlots.map((slot) => getWebsiteMediaItem(settings, slot));
}

export function toAbsolutePublicUrl(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const configuredPublicUrl = import.meta.env.VITE_PUBLIC_URL?.trim();
  const baseUrl = configuredPublicUrl || 'https://tailoredmanor.com';

  return new URL(pathOrUrl, `${baseUrl}/`).toString();
}
