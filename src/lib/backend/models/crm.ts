import type {
  Consultation,
  ConsultationStatus,
  Enquiry,
  EnquiryNote,
  EnquirySource,
  EnquiryStatus,
  PlacedVisualiserItem,
  QuoteRecord,
  QuoteStatus,
  VisualiserSession,
  VisualiserSessionStatus,
} from '../../../types';

type LegacyEnquiryShape = Omit<Partial<Enquiry>, 'notes'> & {
  name?: string;
  email?: string;
  clientEmail?: string;
  clientPhone?: string;
  interestedProducts?: string[];
  source?: string;
  sourceLabel?: string;
  configuration?: Enquiry['configuration'];
  notes?: Enquiry['notes'] | string;
};

interface LegacyConsultationShape extends Partial<Consultation> {
  owner?: string;
}

type LegacyQuoteShape = Omit<Partial<QuoteRecord>, 'notes'> & {
  enquiryId?: string;
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  quoteNumber?: string;
  amountZMW?: number;
  lineItems?: Array<{
    productId?: string;
    productName?: string;
  }>;
  notes?: string | string[];
};

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

const quoteStatuses: QuoteStatus[] = [
  'Draft',
  'Requested',
  'Sent',
  'Negotiation',
  'Won',
  'Lost',
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
  if (typeof value === 'string' && value.trim()) {
    return [
      {
        id: 'note-1',
        author: 'System',
        message: value.trim(),
        createdAt: '',
      },
    ];
  }

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
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'new') return 'New';
  if (normalized === 'consultation scheduled' || normalized === 'consultation_scheduled') {
    return 'Consultation Scheduled';
  }
  if (normalized === 'quote sent' || normalized === 'quote_sent' || normalized === 'sent') {
    return 'Quote Sent';
  }
  if (normalized === 'negotiation') return 'Negotiation';
  if (normalized === 'won') return 'Won';
  if (normalized === 'lost') return 'Lost';
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
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'quote-request' || normalized === 'quote request') {
    return 'configurator';
  }
  if (normalized === 'book consultation' || normalized === 'consultation form') {
    return 'consultation';
  }
  return enquirySources.includes(value as EnquirySource) ? (value as EnquirySource) : 'direct';
}

function normalizeQuoteStatus(value: unknown): QuoteStatus {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'requested') return 'Requested';
  if (normalized === 'sent' || normalized === 'quote sent' || normalized === 'quote_sent') {
    return 'Sent';
  }
  if (normalized === 'negotiation') return 'Negotiation';
  if (normalized === 'won') return 'Won';
  if (normalized === 'lost') return 'Lost';
  if (normalized === 'draft') return 'Draft';
  return quoteStatuses.includes(value as QuoteStatus) ? (value as QuoteStatus) : 'Draft';
}

export function normalizeEnquiryRecord(
  enquiryId: string,
  raw: LegacyEnquiryShape,
): Enquiry {
  const productIds = asStringArray(raw.productIds ?? raw.interestedProducts);
  const notes = asEnquiryNotes(raw.notes);
  const configuration = raw.configuration ?? raw.configurationData;
  const sourceLabel = asString(raw.sourceLabel ?? raw.source ?? raw.channel) || undefined;
  return {
    id: enquiryId,
    type: normalizeSource(raw.type ?? raw.source),
    clientName: asString(raw.clientName ?? raw.name, 'Unknown client'),
    phone: asString(raw.phone ?? raw.clientPhone),
    email: asString(raw.email ?? raw.clientEmail),
    productIds,
    productNames: asStringArray(raw.productNames),
    status: normalizeEnquiryStatus(raw.status),
    assignedTo: asString(raw.assignedTo) || undefined,
    channel: asString(raw.channel ?? raw.sourceLabel ?? raw.source, 'Website enquiry'),
    sourceLabel,
    createdAt: asString(raw.createdAt),
    notes,
    configuration,
    configurationData: configuration,
    visualiserSessionId: asString(raw.visualiserSessionId) || undefined,
    visualiserScreenshot: asString(raw.visualiserScreenshot) || undefined,
    preferredContactTime: asString(raw.preferredContactTime) || undefined,
    read: typeof raw.read === 'boolean' ? raw.read : true,
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

export function normalizeQuoteRecord(
  quoteId: string,
  raw: LegacyQuoteShape,
): QuoteRecord {
  const lineItems = Array.isArray(raw.lineItems) ? raw.lineItems : [];
  const productIds = Array.from(
    new Set(
      [
        ...asStringArray(raw.productIds),
        ...lineItems
          .map((item) => asString(item.productId))
          .filter(Boolean),
      ],
    ),
  );
  const productNames = Array.from(
    new Set(
      [
        ...asStringArray(raw.productNames),
        ...lineItems
          .map((item) => asString(item.productName))
          .filter(Boolean),
      ],
    ),
  );

  const notesValue = Array.isArray(raw.notes)
    ? raw.notes.filter((entry): entry is string => typeof entry === 'string').join('\n')
    : asString(raw.notes);

  return {
    id: quoteId,
    leadId: asString(raw.leadId ?? raw.enquiryId) || undefined,
    consultationId: asString(raw.consultationId) || undefined,
    clientName: asString(raw.clientName, 'Unknown client'),
    clientEmail: asString(raw.clientEmail) || undefined,
    clientPhone: asString(raw.clientPhone) || undefined,
    quoteNumber: asString(raw.quoteNumber) || undefined,
    status: normalizeQuoteStatus(raw.status),
    productIds,
    productNames,
    summary: asString(raw.summary, productNames.join(', ') || 'Quote record'),
    amount: Number(raw.amount ?? raw.amountZMW ?? 0) || undefined,
    notes: notesValue || undefined,
    validUntil: asString(raw.validUntil) || undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}
