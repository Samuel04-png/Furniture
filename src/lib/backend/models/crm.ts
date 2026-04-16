import type {
  Consultation,
  ConsultationStatus,
  Enquiry,
  EnquiryNote,
  EnquirySource,
  EnquiryStatus,
  PlacedVisualiserItem,
  VisualiserSession,
  VisualiserSessionStatus,
} from '../../../types';

interface LegacyEnquiryShape extends Partial<Enquiry> {
  source?: EnquirySource;
}

interface LegacyConsultationShape extends Partial<Consultation> {
  owner?: string;
}

interface LegacyVisualiserSessionShape extends Partial<VisualiserSession> {
  image?: string;
}

const enquiryStatuses: EnquiryStatus[] = [
  'New',
  'Consultation Scheduled',
  'Quote Sent',
  'Negotiation',
  'Won',
  'Lost',
];

const consultationStatuses: ConsultationStatus[] = [
  'Scheduled',
  'Completed',
  'Rescheduled',
  'Cancelled',
];

const sessionStatuses: VisualiserSessionStatus[] = [
  'New',
  'Contacted',
  'Consultation Booked',
  'Closed',
];

const enquirySources: EnquirySource[] = [
  'direct',
  'consultation',
  'visualiser',
  'configurator',
];

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function asEnquiryNotes(value: unknown): EnquiryNote[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const note = entry as Partial<EnquiryNote>;
      return {
        id: asString(note.id, `note-${index + 1}`),
        author: asString(note.author, 'Admin'),
        message: asString(note.message),
        createdAt: asString(note.createdAt),
      };
    })
    .filter((entry): entry is EnquiryNote => Boolean(entry));
}

function asPlacedItems(value: unknown): PlacedVisualiserItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is PlacedVisualiserItem => Boolean(entry && typeof entry === 'object')) as PlacedVisualiserItem[];
}

function normalizeEnquiryStatus(value: unknown): EnquiryStatus {
  return enquiryStatuses.includes(value as EnquiryStatus) ? (value as EnquiryStatus) : 'New';
}

function normalizeConsultationStatus(value: unknown): ConsultationStatus {
  return consultationStatuses.includes(value as ConsultationStatus)
    ? (value as ConsultationStatus)
    : 'Scheduled';
}

function normalizeSessionStatus(value: unknown): VisualiserSessionStatus {
  return sessionStatuses.includes(value as VisualiserSessionStatus)
    ? (value as VisualiserSessionStatus)
    : 'New';
}

function normalizeSource(value: unknown): EnquirySource {
  return enquirySources.includes(value as EnquirySource) ? (value as EnquirySource) : 'direct';
}

export function normalizeEnquiryRecord(
  enquiryId: string,
  raw: LegacyEnquiryShape,
): Enquiry {
  return {
    id: enquiryId,
    type: normalizeSource(raw.type ?? raw.source),
    clientName: asString(raw.clientName, 'Unknown client'),
    phone: asString(raw.phone),
    email: asString(raw.email),
    productIds: asStringArray(raw.productIds),
    productNames: asStringArray(raw.productNames),
    status: normalizeEnquiryStatus(raw.status),
    assignedTo: asString(raw.assignedTo) || undefined,
    channel: asString(raw.channel, 'Website enquiry'),
    createdAt: asString(raw.createdAt),
    notes: asEnquiryNotes(raw.notes),
    configurationData: raw.configurationData,
    visualiserSessionId: asString(raw.visualiserSessionId) || undefined,
    visualiserScreenshot: asString(raw.visualiserScreenshot) || undefined,
    preferredContactTime: asString(raw.preferredContactTime) || undefined,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeConsultationRecord(
  consultationId: string,
  raw: LegacyConsultationShape,
): Consultation {
  return {
    id: consultationId,
    enquiryId: asString(raw.enquiryId) || undefined,
    clientName: asString(raw.clientName, 'Unknown client'),
    phone: asString(raw.phone),
    email: asString(raw.email),
    scheduledAt: asString(raw.scheduledAt),
    assignedDesigner: asString(raw.assignedDesigner ?? raw.owner),
    status: normalizeConsultationStatus(raw.status),
    source: normalizeSource(raw.source),
    notes: asString(raw.notes),
    visualiserSessionId: asString(raw.visualiserSessionId) || undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

export function normalizeVisualiserSessionRecord(
  sessionId: string,
  raw: LegacyVisualiserSessionShape,
): VisualiserSession {
  return {
    id: sessionId,
    roomPhotoUrl: asString(raw.roomPhotoUrl ?? raw.image),
    roomPhotoPath: raw.roomPhotoPath ?? null,
    roomName: asString(raw.roomName, 'Untitled room'),
    placedItems: asPlacedItems(raw.placedItems),
    submittedAt: asString(raw.submittedAt),
    status: normalizeSessionStatus(raw.status),
    clientName: asString(raw.clientName) || undefined,
    phone: asString(raw.phone) || undefined,
    email: asString(raw.email) || undefined,
    assignedTo: asString(raw.assignedTo) || undefined,
    enquiryId: asString(raw.enquiryId) || undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}
