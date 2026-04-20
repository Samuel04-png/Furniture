import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectId = 'tailored-manor';
const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } };

function readAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
    tokens?: { access_token?: string };
  };

  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error('Unable to read Firebase CLI access token.');
  }

  return token;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((entry) => stripUndefinedDeep(entry))
      .filter((entry) => entry !== undefined) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefinedDeep(entry)]),
    ) as T;
  }

  return value;
}

function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map((entry) => fromFirestoreValue(entry));
  }
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, entry]) => [key, fromFirestoreValue(entry)]),
    );
  }
  return undefined;
}

function fromFirestoreFields(fields?: Record<string, FirestoreValue>) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((entry) => toFirestoreValue(entry)) } };
  }
  if (value && typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toFirestoreValue(entry)]),
        ),
      },
    };
  }
  return { nullValue: null };
}

async function fetchDocument(token: string, documentPath: string) {
  const response = await fetch(`${firestoreBaseUrl}/${documentPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${documentPath}: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as FirestoreDocument;
}

async function overwriteDocument(token: string, documentPath: string, payload: Record<string, unknown>) {
  const response = await fetch(`${firestoreBaseUrl}/${documentPath}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: Object.fromEntries(
        Object.entries(stripUndefinedDeep(payload)).map(([key, value]) => [key, toFirestoreValue(value)]),
      ),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to write ${documentPath}: ${response.status} ${await response.text()}`);
  }
}

function currentSiteAsset(pathname: string) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function createPortfolioProject(
  now: string,
  record: {
    id: string;
    slug: string;
    title: string;
    location: string;
    category: string;
    heroImage: string;
    gallery: string[];
    summary: string;
    challenge: string;
    solution: string;
    materials: string[];
    metrics: string[];
    testimonial: string;
    sortOrder: number;
  },
) {
  return {
    ...record,
    visibleOnSite: true,
    createdAt: now,
    updatedAt: now,
    createdBy: 'lighting-content-script',
    updatedBy: 'lighting-content-script',
  };
}

async function main() {
  const token = readAccessToken();
  const now = new Date().toISOString();

  const websiteMedia = {
    homeHeroPoster: {
      slot: 'homeHeroPoster',
      label: 'Homepage hero poster',
      pagePath: '/',
      image: currentSiteAsset(
        '/assets/bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design â€” this bedroom setup (1).jpg',
      ),
      alt: 'Tailored Manor workshop bedroom scene used as the homepage hero poster.',
      description: 'Fallback poster image for the homepage hero video, preserving the crafted bedroom mood before motion starts.',
      story: 'This image still anchors the homepage video with a recognisable Tailored Manor setting before motion begins.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    homeSignatureFeature: {
      slot: 'homeSignatureFeature',
      label: 'Homepage signature feature',
      pagePath: '/',
      image: currentSiteAsset('/assets/editorial/lighting/bubble-chandelier.webp'),
      alt: 'Sculptural bubble chandelier hovering over a warm lounge setting.',
      description: 'Homepage editorial image that expands the story from furniture into full-room atmosphere.',
      story: 'This frame introduces lighting as part of how Tailored Manor shapes a room: furniture, glow, and mood working together rather than competing.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    aboutHero: {
      slot: 'aboutHero',
      label: 'About page hero',
      pagePath: '/about',
      image: currentSiteAsset('/assets/editorial/lighting/ring-chandelier.webp'),
      alt: 'Minimal ring chandelier suspended in a calm, light-filled interior.',
      description: 'About-page hero showing restraint, clarity, and sculptural atmosphere.',
      story: 'The brand story now opens with a cleaner lighting statement so the studio reads as an interior experience brand, not only a furniture maker.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    collectionsHero: {
      slot: 'collectionsHero',
      label: 'Collections page hero',
      pagePath: '/collections',
      image: currentSiteAsset(
        '/assets/Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe (1).jpg',
      ),
      alt: 'Luxury seating scene used as the collections page hero.',
      description: 'Lead editorial image for the collections catalogue.',
      story: 'The collection still opens with furniture first so browsing begins from the core product story.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    materialsHero: {
      slot: 'materialsHero',
      label: 'Materials page hero',
      pagePath: '/materials',
      image: currentSiteAsset(
        '/assets/ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (4).jpg',
      ),
      alt: 'Warm dining furniture scene used on the materials page.',
      description: 'Hero image for the material library, giving the timber story a lived-in interior context.',
      story: 'The materials page stays grounded in timber and furniture so the lighting edit complements the site without confusing the wood narrative.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    contactHero: {
      slot: 'contactHero',
      label: 'Contact page hero',
      pagePath: '/contact',
      image: currentSiteAsset('/assets/editorial/lighting/vertical-crystal-sconce.jpg'),
      alt: 'Vertical crystal wall sconce casting warm light against a softly styled wall.',
      description: 'Warm invitation image for the contact page.',
      story: 'This creates a more intimate first-contact mood, like stepping into a softly lit showroom corner before the conversation starts.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    bookConsultationHero: {
      slot: 'bookConsultationHero',
      label: 'Consultation page hero',
      pagePath: '/book-consultation',
      image: currentSiteAsset('/assets/editorial/lighting/crystal-wall-suite.webp'),
      alt: 'Crystal wall light installed in a refined room setting.',
      description: 'Consultation hero that frames the booking flow as polished and design-led.',
      story: 'The booking page now opens with a room-ready light scene so the user feels they are booking a creative session, not filling out a generic form.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    theProcessHero: {
      slot: 'theProcessHero',
      label: 'Process page hero',
      pagePath: '/the-process',
      image: currentSiteAsset('/assets/editorial/stone-lights/stone-triple-glow.jpg'),
      alt: 'Stone-globe brass light study photographed against a clean backdrop.',
      description: 'Process-page hero highlighting craft, hardware, and composition.',
      story: 'Using the stone-light study here makes the process page feel closer to an atelier storyboard: design, material, assembly, and final glow.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    configuratorHero: {
      slot: 'configuratorHero',
      label: 'Configurator hero',
      pagePath: '/configure',
      image: currentSiteAsset(
        '/assets/ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (2).jpg',
      ),
      alt: 'Dining room image used as the configurator hero.',
      description: 'Primary hero image for the furniture configurator flow.',
      story: 'The configurator stays anchored in furniture because this flow is still about specifying a tailored piece.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    configuratorConfirmationHero: {
      slot: 'configuratorConfirmationHero',
      label: 'Configurator confirmation hero',
      pagePath: '/configure/confirmation',
      image: currentSiteAsset(
        '/assets/ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (1).jpg',
      ),
      alt: 'Confirmation-state dining room image used after a configurator submission.',
      description: 'Success-state hero image after a configurator quote request is sent.',
      story: 'The confirmation step stays calm and familiar so the user feels reassured immediately after submitting a request.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
    notFoundHero: {
      slot: 'notFoundHero',
      label: 'Not found page hero',
      pagePath: '/404',
      image: currentSiteAsset(
        '/assets/full bedroom setup/Tailored to reflect your style and provide the comfort you deserve. Transforming a house (4).jpg',
      ),
      alt: 'Bedroom scene used on the 404 page.',
      description: 'Fallback hero image for unknown routes.',
      story: 'Even the fallback route stays elegant and on-brand.',
      updatedAt: now,
      updatedBy: 'lighting-content-script',
    },
  };

  const portfolioProjects = [
    createPortfolioProject(now, {
      id: 'stone-light-atelier',
      slug: 'stone-light-atelier',
      title: 'Stone Light Atelier',
      location: 'Lusaka editorial collection',
      category: 'Lighting editorial',
      heroImage: currentSiteAsset('/assets/editorial/stone-lights/stone-light-atelier-hero.jpg'),
      gallery: [
        currentSiteAsset('/assets/editorial/stone-lights/stone-linear-brass.jpg'),
        currentSiteAsset('/assets/editorial/stone-lights/stone-triple-glow.jpg'),
        currentSiteAsset('/assets/editorial/stone-lights/stone-branching-profile.jpg'),
        currentSiteAsset('/assets/editorial/stone-lights/stone-hardware-detail.jpg'),
      ],
      summary:
        'A sculptural lighting capsule built around stone globes, brushed brass stems, and fixtures that feel collected rather than mass-produced.',
      challenge:
        'Introduce lighting into the brand story without losing Tailored Manor’s emphasis on warmth, craft, and room composition.',
      solution:
        'Each fitting is framed as an architectural accent that completes a room’s mood the same way a tailored furniture piece completes its function.',
      materials: ['Brushed brass', 'Stone globes', 'Warm LED glow', 'Sculptural arms'],
      metrics: ['Stone and brass palette', 'Ambient feature lighting', 'Editorial launch capsule'],
      testimonial: 'These fittings read like jewelry for the room.',
      sortOrder: 10,
    }),
    createPortfolioProject(now, {
      id: 'halo-and-crystal-wall-lights',
      slug: 'halo-and-crystal-wall-lights',
      title: 'Halo and Crystal Wall Lights',
      location: 'Tailored Manor lighting edit',
      category: 'Lighting editorial',
      heroImage: currentSiteAsset('/assets/editorial/lighting/crystal-wall-suite.webp'),
      gallery: [
        currentSiteAsset('/assets/editorial/lighting/halo-wall-light.jpg'),
        currentSiteAsset('/assets/editorial/lighting/sculptural-duo-wall.webp'),
        currentSiteAsset('/assets/editorial/lighting/vertical-crystal-sconce.jpg'),
        currentSiteAsset('/assets/editorial/lighting/graphic-balance-wall.webp'),
      ],
      summary:
        'A wall-light edit that moves from crisp halo geometry to prismatic crystal glow, adding intimacy and evening atmosphere to the site.',
      challenge:
        'Show how smaller lighting gestures can still transform the perception of luxury without requiring a full room reset.',
      solution:
        'The story focuses on wall-mounted pieces as mood setters for corridors, headboards, entry moments, and softly layered ambient light.',
      materials: ['Crystal prisms', 'Brushed gold', 'Opal glow', 'Halo detailing'],
      metrics: ['Wall light styling edit', 'Warm ambient contrast', 'Hospitality-inspired detail'],
      testimonial: 'The glow feels soft, expensive, and intentionally placed.',
      sortOrder: 20,
    }),
    createPortfolioProject(now, {
      id: 'sculptural-pendant-edit',
      slug: 'sculptural-pendant-edit',
      title: 'Sculptural Pendant Edit',
      location: 'Tailored Manor style direction',
      category: 'Lighting editorial',
      heroImage: currentSiteAsset('/assets/editorial/lighting/bubble-chandelier.webp'),
      gallery: [
        currentSiteAsset('/assets/editorial/lighting/ring-chandelier.webp'),
        currentSiteAsset('/assets/editorial/lighting/sculptural-pendant-cluster.webp'),
        currentSiteAsset('/assets/editorial/lighting/graphic-balance-wall.webp'),
        currentSiteAsset('/assets/editorial/lighting/crystal-wall-suite.webp'),
      ],
      summary:
        'A high-drama pendant edit showing how ceiling pieces can anchor the whole emotional register of a room before the furniture even begins.',
      challenge:
        'Create a portfolio story bold enough to stop the scroll while still feeling coherent with the brand’s warm, tailored tone.',
      solution:
        'Strong silhouettes are balanced with softened finishes and calm compositions so the pendants read as focal points without breaking the overall serenity.',
      materials: ['Gold finish', 'Sculptural glass', 'Ring profiles', 'Layered light'],
      metrics: ['Statement ceiling lights', 'Social-ready hero imagery', 'Interior focal-point story'],
      testimonial: 'The ceiling piece stops the scroll before the furniture even begins.',
      sortOrder: 30,
    }),
  ];

  const settingsDocument = await fetchDocument(token, 'settings/companyProfile');
  const currentSettings = fromFirestoreFields(settingsDocument?.fields) as Record<string, unknown>;

  await overwriteDocument(token, 'settings/companyProfile', {
    ...currentSettings,
    websiteMedia,
    updatedAt: now,
    updatedBy: 'lighting-content-script',
  });

  for (const project of portfolioProjects) {
    await overwriteDocument(token, `portfolioProjects/${project.id}`, project);
  }

  console.log(
    `Populated ${portfolioProjects.length} lighting portfolio projects and ${Object.keys(websiteMedia).length} website media records.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
