import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentDeleted, onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.STORAGE_BUCKET ||
  'tailored-manor.firebasestorage.app';

function ensureAdminApp() {
  const { getApps, initializeApp } = require('firebase-admin/app') as typeof import('firebase-admin/app');
  if (!getApps().length) {
    initializeApp({
      storageBucket,
    });
  }
}

function createLazyProxy<T extends object>(factory: () => T) {
  return new Proxy({} as T, {
    get(_target, property) {
      const instance = factory();
      const value = Reflect.get(instance as object, property);
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  });
}

function fieldValue() {
  return require('firebase-admin/firestore').FieldValue as {
    serverTimestamp: () => unknown;
    arrayUnion: (...values: unknown[]) => unknown;
  };
}

const auth = createLazyProxy(() => {
  ensureAdminApp();
  return require('firebase-admin/auth').getAuth();
});
const db = createLazyProxy(() => {
  ensureAdminApp();
  return require('firebase-admin/firestore').getFirestore();
});
const bucket = createLazyProxy(() => {
  ensureAdminApp();
  return require('firebase-admin/storage').getStorage().bucket(storageBucket);
});
const region = process.env.FUNCTIONS_REGION || 'africa-south1';

type TeamRole =
  | 'Owner'
  | 'Admin'
  | 'Sales'
  | 'Designer'
  | 'Production Manager'
  | 'Inventory Manager'
  | 'Procurement'
  | 'Accountant'
  | 'Read Only';

type TeamStatus = 'Invited' | 'Active' | 'Disabled';

type AutomationEventType =
  | 'lead.created'
  | 'lead.consultation_scheduled'
  | 'lead.quote_sent'
  | 'consultation.scheduled'
  | 'finance.overdue'
  | 'inventory.low_stock'
  | 'job.stage_changed';

type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger';

const automationEventConfig: Record<
  AutomationEventType,
  {
    workspace: string;
    severity: NotificationSeverity;
    targetRoles: TeamRole[];
    relatedPath: string;
  }
> = {
  'lead.created': {
    workspace: 'pipeline',
    severity: 'info',
    targetRoles: ['Owner', 'Admin', 'Sales'],
    relatedPath: '/admin/pipeline/leads',
  },
  'lead.consultation_scheduled': {
    workspace: 'pipeline',
    severity: 'success',
    targetRoles: ['Owner', 'Admin', 'Sales', 'Designer'],
    relatedPath: '/admin/pipeline/consultations',
  },
  'lead.quote_sent': {
    workspace: 'pipeline',
    severity: 'warning',
    targetRoles: ['Owner', 'Admin', 'Sales'],
    relatedPath: '/admin/pipeline/quotes',
  },
  'consultation.scheduled': {
    workspace: 'pipeline',
    severity: 'success',
    targetRoles: ['Owner', 'Admin', 'Sales', 'Designer'],
    relatedPath: '/admin/pipeline/consultations',
  },
  'finance.overdue': {
    workspace: 'finance',
    severity: 'danger',
    targetRoles: ['Owner', 'Admin', 'Accountant'],
    relatedPath: '/admin/finance/invoices',
  },
  'inventory.low_stock': {
    workspace: 'materials',
    severity: 'warning',
    targetRoles: ['Owner', 'Admin', 'Inventory Manager', 'Procurement'],
    relatedPath: '/admin/materials/stock',
  },
  'job.stage_changed': {
    workspace: 'jobs',
    severity: 'info',
    targetRoles: ['Owner', 'Admin', 'Production Manager'],
    relatedPath: '/admin/jobs/board',
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeRole(role: string | undefined) {
  const value = String(role || '').trim();
  const canonicalRoles: Record<string, TeamRole> = {
    owner: 'Owner',
    admin: 'Admin',
    sales: 'Sales',
    designer: 'Designer',
    'production manager': 'Production Manager',
    'inventory manager': 'Inventory Manager',
    procurement: 'Procurement',
    accountant: 'Accountant',
    'read only': 'Read Only',
    readonly: 'Read Only',
    operations: 'Admin',
    workshop: 'Production Manager',
    production: 'Production Manager',
    inventory: 'Inventory Manager',
  };

  return canonicalRoles[value.toLowerCase()] || 'Read Only';
}

function createInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'TM'
  );
}

function randomPassword() {
  return `TM-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

async function resolveTeamAccess(authData: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!authData?.uid) {
    return {
      uid: null,
      role: 'Read Only' as TeamRole,
      status: null as TeamStatus | null,
      approved: false,
    };
  }

  const tokenRole = normalizeRole(authData.token?.role as string | undefined);
  const tokenApproved = authData.token?.approved === true;
  const tokenDisabled = authData.token?.disabled === true;
  const userSnapshot = await db.collection('users').doc(authData.uid).get();
  const userData = userSnapshot.exists
    ? (userSnapshot.data() as { role?: string; status?: TeamStatus; active?: boolean })
    : undefined;
  const status =
    userData?.status ||
    (userData?.active === false ? 'Disabled' : null);
  const disabled =
    tokenDisabled ||
    userData?.active === false ||
    status === 'Disabled';

  return {
    uid: authData.uid,
    role: userData?.role
      ? normalizeRole(userData.role)
      : tokenRole,
    status,
    approved: !disabled && (tokenApproved || userSnapshot.exists),
  };
}

async function requireAdmin(authData: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!authData?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const { role, approved } = await resolveTeamAccess(authData);
  if (!approved) {
    throw new HttpsError('permission-denied', 'This account is not approved for admin access.');
  }
  if (role !== 'Owner' && role !== 'Admin') {
    throw new HttpsError('permission-denied', 'Only owners and admins can perform this action.');
  }

  return role;
}

async function requireSignedIn(authData: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!authData?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const { role, approved } = await resolveTeamAccess(authData);
  if (!approved) {
    throw new HttpsError('permission-denied', 'This account is not approved for admin access.');
  }

  return {
    uid: authData.uid,
    role,
  };
}

async function writeAuditLog(module: string, recordId: string, action: string, payload: Record<string, unknown>) {
  await db.collection('auditLogs').add({
    module,
    recordId,
    action,
    payload,
    createdAt: fieldValue().serverTimestamp(),
  });
}

function renderTemplate(text: string, context: Record<string, string | number | boolean | null | undefined>) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = context[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function normalizeRoleList(input: unknown, fallback: TeamRole[]) {
  const values = Array.isArray(input)
    ? input.map((entry) => normalizeRole(String(entry || '')))
    : fallback;
  const normalized = Array.from(new Set(values.filter(Boolean))) as TeamRole[];
  return normalized.length ? normalized : fallback;
}

function stripUndefinedValues(value: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

async function createAutomationNotifications(options: {
  eventType: AutomationEventType;
  recordId: string;
  eventKey: string;
  context: Record<string, string | number | boolean | null | undefined>;
}) {
  const event = automationEventConfig[options.eventType];
  const rulesSnapshot = await db
    .collection('automations')
    .where('state', '==', 'Active')
    .where('eventType', '==', options.eventType)
    .get();

  if (rulesSnapshot.empty) {
    return 0;
  }

  const templateCache = new Map<string, FirebaseFirestore.DocumentData | null>();
  let createdCount = 0;

  for (const ruleDoc of rulesSnapshot.docs) {
    const rule = ruleDoc.data();
    const templateId = typeof rule.templateId === 'string' ? rule.templateId : null;
    let template: FirebaseFirestore.DocumentData | null = null;

    if (templateId) {
      if (!templateCache.has(templateId)) {
        const templateDoc = await db.collection('templates').doc(templateId).get();
        templateCache.set(templateId, templateDoc.exists ? templateDoc.data() ?? null : null);
      }
      template = templateCache.get(templateId) ?? null;
    }

    const notificationId = `${ruleDoc.id}__${options.recordId}__${slugify(options.eventKey)}`;
    const notificationRef = db.collection('notifications').doc(notificationId);
    if ((await notificationRef.get()).exists) {
      continue;
    }

    const targetRoles = normalizeRoleList(rule.targetRoles, event.targetRoles);
    const severity =
      (rule.severity as NotificationSeverity | undefined) || event.severity;
    const metadata = stripUndefinedValues(options.context);
    const title = renderTemplate(String(rule.title || template?.label || 'Automation update'), options.context).trim();
    const body = renderTemplate(
      String(rule.detail || template?.body || 'A workflow event needs your attention.'),
      options.context,
    ).trim();

    await notificationRef.set({
      id: notificationId,
      automationId: ruleDoc.id,
      automationTitle: String(rule.title || ''),
      templateId,
      eventType: options.eventType,
      workspace: String(rule.workspace || event.workspace),
      relatedRecordId: options.recordId,
      relatedPath: `${event.relatedPath}?highlight=${options.recordId}`,
      title: title || 'Automation update',
      body: body || 'A workflow event needs your attention.',
      severity,
      targetRoles,
      readBy: [],
      triggeredAt: fieldValue().serverTimestamp(),
      metadata,
      createdAt: fieldValue().serverTimestamp(),
      updatedAt: fieldValue().serverTimestamp(),
      createdBy: null,
      updatedBy: null,
    });
    createdCount += 1;
  }

  return createdCount;
}

function sanitizePublishedProduct(productId: string, raw: Record<string, any>) {
  const website = raw.website || {};
  return {
    id: productId,
    slug: raw.slug || slugify(raw.name || productId),
    name: raw.name || '',
    category: raw.category || 'Seating',
    room: raw.room || 'Living',
    style: raw.style || 'Contemporary',
    status: 'Live',
    materials: Array.isArray(raw.materials) ? raw.materials : [],
    finishes: Array.isArray(raw.finishes) ? raw.finishes : [],
    upholsterySwatches: Array.isArray(raw.upholsterySwatches) ? raw.upholsterySwatches : [],
    heroImage: raw.heroImage || raw.imageUrl || '',
    cardImage: raw.cardImage || raw.imageUrl || raw.heroImage || '',
    gallery: Array.isArray(raw.gallery) && raw.gallery.length
      ? raw.gallery
      : [raw.heroImage || raw.imageUrl || '', raw.cardImage || raw.imageUrl || raw.heroImage || ''].filter(Boolean),
    summary: raw.summary || '',
    story: raw.story || raw.summary || '',
    description: raw.description || raw.summary || '',
    dimensions: raw.dimensions || { width: 0, depth: 0, height: 0 },
    sizePresets: Array.isArray(raw.sizePresets) ? raw.sizePresets : [],
    customDimensions: Boolean(raw.customDimensions),
    priceFrom: Number(raw.priceFrom || 0),
    leadTime: raw.leadTime || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    overlayKind: raw.overlayKind || 'sofa',
    silhouetteTone: raw.silhouetteTone || null,
    processGallery: Array.isArray(raw.processGallery) ? raw.processGallery : [],
    website: {
      isPublished: true,
      visibility: 'public',
      featured: Boolean(website.featured),
      featuredOrder: Number(website.featuredOrder || 999),
      storeTitle: website.storeTitle || raw.name || '',
      storeSummary: website.storeSummary || raw.summary || '',
      storeDescription: website.storeDescription || raw.description || '',
      seoTitle: website.seoTitle || raw.name || '',
      seoDescription: website.seoDescription || raw.summary || '',
      publishedAt: website.publishedAt || null,
      publishedBy: website.publishedBy || null,
    },
    updatedAt: fieldValue().serverTimestamp(),
  };
}

function getProductPublishedState(raw: Record<string, any> | undefined) {
  if (!raw) {
    return false;
  }

  const hasExplicitPublishFlag =
    typeof raw.publishedToWebsite === 'boolean' ||
    typeof raw.website?.isPublished === 'boolean';

  return (
    raw.publishedToWebsite === true ||
    (raw.website?.isPublished === true &&
      String(raw.website?.visibility || 'public') === 'public') ||
    (!hasExplicitPublishFlag && raw.status === 'Live')
  );
}

async function deletePrefix(prefix: string) {
  const [files] = await bucket.getFiles({ prefix });
  if (!files.length) return;
  await Promise.all(files.map((file: any) => file.delete().catch(() => undefined)));
}

async function syncPublishedProductRecord(productId: string, after: Record<string, any> | undefined) {
  if (!after) {
    await db.collection('publishedProducts').doc(productId).delete().catch(() => undefined);
    return false;
  }

  const shouldPublish = getProductPublishedState(after);
  const publishedRef = db.collection('publishedProducts').doc(productId);
  if (shouldPublish) {
    await publishedRef.set(sanitizePublishedProduct(productId, after), { merge: true });
    return true;
  }

  await publishedRef.delete().catch(() => undefined);
  return shouldPublish;
}

export const createTeamMember = onCall({ region }, async (request) => {
  // Deploy this callable to the tailored-manor Firebase project in africa-south1.
  await requireAdmin(request.auth || undefined);

  const name = String(request.data?.displayName || request.data?.name || '').trim();
  const email = String(request.data?.email || '').trim().toLowerCase();
  const password = String(request.data?.password || '').trim();
  const role = normalizeRole(String(request.data?.role || 'Read Only'));
  const avatarUrl = String(request.data?.avatarUrl || '').trim();
  const publicProfile = Boolean(request.data?.publicProfile ?? request.data?.isPublicProfile);

  if (!name || !email || !password) {
    throw new HttpsError('invalid-argument', 'Display name, email, and password are required.');
  }

  try {
    await auth.getUserByEmail(email);
    throw new HttpsError('already-exists', 'An account with this email already exists.');
  } catch (error) {
    if (error instanceof HttpsError) throw error;
  }

  const userRecord = await auth.createUser({
    email,
    password,
    displayName: name,
  });

  await auth.setCustomUserClaims(userRecord.uid, { role, approved: true, disabled: false });

  const teamMemberDoc = {
    uid: userRecord.uid,
    name,
    email,
    role,
    initials: createInitials(name),
    phone: '',
    avatarUrl: avatarUrl || null,
    avatarPath: null,
    bio: '',
    publicProfile,
    isPublicProfile: publicProfile,
    active: true,
    status: 'Active',
    createdAt: fieldValue().serverTimestamp(),
    updatedAt: fieldValue().serverTimestamp(),
    createdBy: request.auth?.uid || null,
    updatedBy: request.auth?.uid || null,
  };

  const batch = db.batch();
  batch.set(db.collection('users').doc(userRecord.uid), teamMemberDoc, { merge: true });
  if (publicProfile) {
    batch.set(
      db.collection('teamProfiles').doc(userRecord.uid),
      {
        id: userRecord.uid,
        uid: userRecord.uid,
        name,
        email,
        phone: '',
        role,
        initials: createInitials(name),
        avatarUrl: avatarUrl || null,
        avatarPath: null,
        bio: '',
        publicProfile: true,
        isPublicProfile: true,
        active: true,
        createdAt: fieldValue().serverTimestamp(),
        updatedAt: fieldValue().serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
  await writeAuditLog('system', userRecord.uid, 'team-member-created', {
    role,
    email,
    requestedBy: request.auth?.uid || null,
  });

  return {
    uid: userRecord.uid,
  };
});

export const backfillPublishedProducts = onCall({ region }, async (request) => {
  // Deploy this callable to the tailored-manor Firebase project in africa-south1.
  await requireAdmin(request.auth || undefined);
  const snapshot = await db.collection('products').get();
  const batch = db.batch();
  let publishedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, any>;
    const published = getProductPublishedState(data);
    const website = data.website || {};

    batch.set(
      docSnap.ref,
      {
        publishedToWebsite: published,
        website: {
          ...website,
          isPublished: published,
          visibility: published ? 'public' : 'internal',
          publishedAt: published ? website.publishedAt || fieldValue().serverTimestamp() : null,
          publishedBy: published ? website.publishedBy || request.auth?.uid || null : null,
        },
        updatedAt: fieldValue().serverTimestamp(),
        updatedBy: request.auth?.uid || null,
      },
      { merge: true },
    );
    const publishedRef = db.collection('publishedProducts').doc(docSnap.id);
    if (published) {
      batch.set(publishedRef, sanitizePublishedProduct(docSnap.id, { ...data, publishedToWebsite: true, website: { ...website, isPublished: true, visibility: 'public' } }), { merge: true });
      publishedCount += 1;
    } else {
      batch.delete(publishedRef);
    }
  }

  await batch.commit();

  await writeAuditLog('products', 'backfill', 'published-products-backfill', {
    totalProducts: snapshot.size,
    publishedCount,
    requestedBy: request.auth?.uid || null,
  });

  return {
    totalProducts: snapshot.size,
    publishedCount,
  };
});

export const disableTeamMember = onCall({ region }, async (request) => {
  // Deploy this callable to the tailored-manor Firebase project in africa-south1.
  await requireAdmin(request.auth || undefined);

  const uid = String(request.data?.uid || '').trim();
  if (!uid) {
    throw new HttpsError('invalid-argument', 'A user id is required.');
  }

  await auth.updateUser(uid, { disabled: true });
  await auth.setCustomUserClaims(uid, { role: 'Read Only', approved: false, disabled: true });
  const disabledPatch = {
    active: false,
    publicProfile: false,
    isPublicProfile: false,
    status: 'Disabled',
    updatedAt: fieldValue().serverTimestamp(),
    updatedBy: request.auth?.uid || null,
  };
  await Promise.all([
    db.collection('users').doc(uid).set(disabledPatch, { merge: true }),
  ]);
  await db.collection('teamProfiles').doc(uid).delete().catch(() => undefined);
  await writeAuditLog('system', uid, 'team-member-disabled', {
    requestedBy: request.auth?.uid || null,
  });

  return { success: true };
});

export const markNotificationRead = onCall({ region }, async (request) => {
  const { uid, role } = await requireSignedIn(request.auth || undefined);
  const notificationId = String(request.data?.notificationId || '').trim();

  if (!notificationId) {
    throw new HttpsError('invalid-argument', 'A notification id is required.');
  }

  const notificationRef = db.collection('notifications').doc(notificationId);
  const notificationSnap = await notificationRef.get();
  if (!notificationSnap.exists) {
    throw new HttpsError('not-found', 'Notification not found.');
  }

  const targetRoles = Array.isArray(notificationSnap.data()?.targetRoles)
    ? notificationSnap.data()?.targetRoles
    : [];
  if (!targetRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'You do not have access to this notification.');
  }

  await notificationRef.set(
    {
      readBy: fieldValue().arrayUnion(uid),
      updatedAt: fieldValue().serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true },
  );

  return { success: true };
});

export const markAllNotificationsRead = onCall({ region }, async (request) => {
  const { uid, role } = await requireSignedIn(request.auth || undefined);
  const snapshot = await db.collection('notifications').where('targetRoles', 'array-contains', role).get();
  const batch = db.batch();
  let updatedCount = 0;

  snapshot.docs.forEach((docSnap: any) => {
    const readBy = Array.isArray(docSnap.data().readBy) ? docSnap.data().readBy : [];
    if (readBy.includes(uid)) return;
    batch.set(
      docSnap.ref,
      {
        readBy: fieldValue().arrayUnion(uid),
        updatedAt: fieldValue().serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    );
    updatedCount += 1;
  });

  if (updatedCount) {
    await batch.commit();
  }

  return { success: true, updatedCount };
});

export const syncTeamClaims = onDocumentWritten({ region, document: 'users/{uid}' }, async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after?.data() as Record<string, any> | undefined;

  if (!after) {
    await auth.setCustomUserClaims(uid, null);
    await db.collection('teamProfiles').doc(uid).delete().catch(() => undefined);
    return;
  }

  const role = normalizeRole(after.role);
  const disabled = after.active === false || after.status === 'Disabled';
  await auth.setCustomUserClaims(uid, {
    role: disabled ? 'Read Only' : role,
    approved: !disabled,
    disabled,
  });

  if ((after.publicProfile || after.isPublicProfile) && !disabled) {
    await db.collection('teamProfiles').doc(uid).set(
      {
        id: uid,
        uid,
        name: after.name || '',
        email: after.email || '',
        phone: after.phone || '',
        role,
        initials: after.initials || createInitials(after.name || ''),
        avatarUrl: after.avatarUrl || null,
        avatarPath: after.avatarPath || null,
        bio: after.bio || '',
        publicProfile: true,
        isPublicProfile: true,
        active: true,
        createdAt: after.createdAt || fieldValue().serverTimestamp(),
        updatedAt: fieldValue().serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await db.collection('teamProfiles').doc(uid).delete().catch(() => undefined);
  }
});

export const syncPublishedProduct = onDocumentWritten(
  { region, document: 'products/{productId}' },
  async (event) => {
    const productId = event.params.productId;
    const after = event.data?.after?.data() as Record<string, any> | undefined;

    if (!after) {
      await db.collection('publishedProducts').doc(productId).delete().catch(() => undefined);
      await writeAuditLog('products', productId, 'product-deleted', {});
      return;
    }

    const published = await syncPublishedProductRecord(productId, after);
    if (!published) {
      await writeAuditLog('products', productId, 'product-unpublished', {
        status: after.status || null,
        visibility: after.website?.visibility || null,
      });
      return;
    }
    await writeAuditLog('products', productId, 'product-published-sync', {
      slug: after.slug || null,
      name: after.name || null,
    });
  },
);

export const cleanupDeletedProductFiles = onDocumentDeleted(
  { region, document: 'products/{productId}' },
  async (event) => {
    const productId = event.params.productId;
    try {
      await deletePrefix(`products/${productId}/`);
    } catch (error) {
      logger.error('Failed to cleanup deleted product files', { productId, error });
    }
  },
);

export const cleanupDeletedMaterialFiles = onDocumentDeleted(
  { region, document: 'inventoryItems/{materialId}' },
  async (event) => {
    try {
      await deletePrefix(`website/materials/${event.params.materialId}/`);
    } catch (error) {
      logger.error('Failed to cleanup deleted material files', {
        materialId: event.params.materialId,
        error,
      });
    }
  },
);

export const cleanupDeletedSampleRoomFiles = onDocumentDeleted(
  { region, document: 'sampleRooms/{roomId}' },
  async (event) => {
    try {
      await deletePrefix(`website/sample-rooms/${event.params.roomId}/`);
    } catch (error) {
      logger.error('Failed to cleanup deleted sample room files', {
        roomId: event.params.roomId,
        error,
      });
    }
  },
);

export const cleanupDeletedTestimonialFiles = onDocumentDeleted(
  { region, document: 'testimonials/{testimonialId}' },
  async (event) => {
    try {
      await deletePrefix(`website/testimonials/${event.params.testimonialId}/`);
    } catch (error) {
      logger.error('Failed to cleanup deleted testimonial files', {
        testimonialId: event.params.testimonialId,
        error,
      });
    }
  },
);

export const cleanupDeletedPortfolioFiles = onDocumentDeleted(
  { region, document: 'portfolioProjects/{projectId}' },
  async (event) => {
    try {
      await deletePrefix(`website/portfolio/${event.params.projectId}/`);
    } catch (error) {
      logger.error('Failed to cleanup deleted portfolio files', {
        projectId: event.params.projectId,
        error,
      });
    }
  },
);

export const cleanupDeletedTeamProfileFiles = onDocumentDeleted(
  { region, document: 'teamProfiles/{uid}' },
  async (event) => {
    try {
      await deletePrefix(`website/team-profiles/${event.params.uid}/`);
    } catch (error) {
      logger.error('Failed to cleanup deleted team profile files', {
        uid: event.params.uid,
        error,
      });
    }
  },
);

export const notifyEnquiryAutomations = onDocumentWritten(
  { region, document: 'enquiries/{enquiryId}' },
  async (event) => {
    const before = event.data?.before?.data() as Record<string, any> | undefined;
    const after = event.data?.after?.data() as Record<string, any> | undefined;
    if (!after) return;

    if (!before) {
      await createAutomationNotifications({
        eventType: 'lead.created',
        recordId: event.params.enquiryId,
        eventKey: 'created',
        context: {
          client_name: after.clientName || 'Client',
          product_names: Array.isArray(after.productNames) ? after.productNames.join(', ') : '',
          status: after.status || 'New',
          channel: after.channel || '',
        },
      });
      return;
    }

    if (before.status !== after.status && after.status === 'Consultation Scheduled') {
      await createAutomationNotifications({
        eventType: 'lead.consultation_scheduled',
        recordId: event.params.enquiryId,
        eventKey: `consultation-scheduled-${after.status}`,
        context: {
          client_name: after.clientName || 'Client',
          product_names: Array.isArray(after.productNames) ? after.productNames.join(', ') : '',
          status: after.status,
        },
      });
    }

    if (before.status !== after.status && after.status === 'Quote Sent') {
      await createAutomationNotifications({
        eventType: 'lead.quote_sent',
        recordId: event.params.enquiryId,
        eventKey: `quote-sent-${after.status}`,
        context: {
          client_name: after.clientName || 'Client',
          product_names: Array.isArray(after.productNames) ? after.productNames.join(', ') : '',
          status: after.status,
        },
      });
    }
  },
);

export const notifyConsultationAutomations = onDocumentWritten(
  { region, document: 'consultations/{consultationId}' },
  async (event) => {
    const before = event.data?.before?.data() as Record<string, any> | undefined;
    const after = event.data?.after?.data() as Record<string, any> | undefined;
    if (!after) return;

    if (!before || (before.scheduledAt !== after.scheduledAt && after.status === 'Scheduled')) {
      await createAutomationNotifications({
        eventType: 'consultation.scheduled',
        recordId: event.params.consultationId,
        eventKey: String(after.scheduledAt || 'scheduled'),
        context: {
          client_name: after.clientName || 'Client',
          scheduled_at: after.scheduledAt || '',
          designer: after.assignedDesigner || 'Design team',
        },
      });
    }
  },
);

export const notifyFinanceAutomations = onDocumentWritten(
  { region, document: 'accountingRecords/{recordId}' },
  async (event) => {
    const before = event.data?.before?.data() as Record<string, any> | undefined;
    const after = event.data?.after?.data() as Record<string, any> | undefined;
    if (!after) return;

    if (after.status === 'Overdue' && before?.status !== 'Overdue') {
      await createAutomationNotifications({
        eventType: 'finance.overdue',
        recordId: event.params.recordId,
        eventKey: `overdue-${after.dueDate || event.params.recordId}`,
        context: {
          title: after.title || 'Finance item',
          client_name: after.clientName || 'Client',
          amount: Number(after.amount || 0),
          due_date: after.dueDate || '',
          status: after.status,
        },
      });
    }
  },
);

export const notifyInventoryAutomations = onDocumentWritten(
  { region, document: 'inventoryItems/{inventoryId}' },
  async (event) => {
    const before = event.data?.before?.data() as Record<string, any> | undefined;
    const after = event.data?.after?.data() as Record<string, any> | undefined;
    if (!after) return;

    const isLowStock = Number(after.onHand || 0) <= Number(after.reorderPoint || 0);
    const wasLowStock = before
      ? Number(before.onHand || 0) <= Number(before.reorderPoint || 0)
      : false;

    if (isLowStock && !wasLowStock) {
      await createAutomationNotifications({
        eventType: 'inventory.low_stock',
        recordId: event.params.inventoryId,
        eventKey: `low-stock-${after.onHand || 0}`,
        context: {
          item_name: after.name || 'Inventory item',
          on_hand: Number(after.onHand || 0),
          reorder_point: Number(after.reorderPoint || 0),
          supplier: after.supplier || '',
        },
      });
    }
  },
);

export const notifyJobAutomations = onDocumentWritten(
  { region, document: 'productions/{jobId}' },
  async (event) => {
    const before = event.data?.before?.data() as Record<string, any> | undefined;
    const after = event.data?.after?.data() as Record<string, any> | undefined;
    if (!after || !before || before.status === after.status) return;

    await createAutomationNotifications({
      eventType: 'job.stage_changed',
      recordId: event.params.jobId,
      eventKey: String(after.status || 'job-stage'),
      context: {
        client_name: after.clientName || 'Client',
        product_name: after.productName || 'Production job',
        stage: after.status || '',
        craftsman: after.craftsman || '',
      },
    });
  },
);

export const auditEnquiryWrites = onDocumentWritten(
  { region, document: 'enquiries/{enquiryId}' },
  async (event) => {
    const after = event.data?.after?.data();
    await writeAuditLog('pipeline', event.params.enquiryId, after ? 'enquiry-written' : 'enquiry-deleted', {});
  },
);

export const auditFinanceWrites = onDocumentWritten(
  { region, document: 'accountingRecords/{recordId}' },
  async (event) => {
    const after = event.data?.after?.data();
    await writeAuditLog('finance', event.params.recordId, after ? 'finance-written' : 'finance-deleted', {});
  },
);
