import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import type {
  Consultation,
  Enquiry,
  EnquiryNote,
  QuoteRecord,
  VisualiserSession,
  VisualiserSessionStatus,
} from '../../../types';
import type { UserIdentity } from '../firestore';
import {
  normalizeConsultationRecord,
  normalizeEnquiryRecord,
  normalizeQuoteRecord,
  normalizeVisualiserSessionRecord,
} from '../models/crm';
import {
  createDocument,
  removeDocument,
  subscribeCollection,
  subscribeMergedCollections,
  upsertDocument,
  withCreateAudit,
} from '../firestore';

function mapLeadForWrite(enquiry: Enquiry) {
  const configuration = enquiry.configuration ?? enquiry.configurationData ?? null;
  return {
    id: enquiry.id,
    type: enquiry.type,
    name: enquiry.clientName,
    clientName: enquiry.clientName,
    email: enquiry.email,
    phone: enquiry.phone,
    source: enquiry.sourceLabel ?? enquiry.channel ?? enquiry.type,
    status:
      enquiry.status === 'Consultation Scheduled'
        ? 'consultation_scheduled'
        : enquiry.status === 'Quote Sent'
          ? 'quote_sent'
          : enquiry.status.toLowerCase(),
    notes: enquiry.notes,
    assignedTo: enquiry.assignedTo ?? null,
    productIds: enquiry.productIds,
    productNames: enquiry.productNames,
    channel: enquiry.channel,
    preferredContactTime: enquiry.preferredContactTime ?? '',
    read: enquiry.read ?? false,
    configuration,
    configurationData: configuration,
    visualiserSessionId: enquiry.visualiserSessionId ?? null,
    visualiserScreenshot: enquiry.visualiserScreenshot ?? null,
  };
}

function mapLeadPatch(patch: Partial<Enquiry>) {
  const configuration = patch.configuration ?? patch.configurationData;
  return {
    type: patch.type,
    name: patch.clientName,
    clientName: patch.clientName,
    email: patch.email,
    phone: patch.phone,
    source: patch.sourceLabel ?? patch.channel ?? patch.type,
    status:
      patch.status === 'Consultation Scheduled'
        ? 'consultation_scheduled'
        : patch.status === 'Quote Sent'
          ? 'quote_sent'
          : patch.status?.toLowerCase(),
    notes: patch.notes,
    assignedTo: patch.assignedTo,
    productIds: patch.productIds,
    productNames: patch.productNames,
    channel: patch.channel,
    read: patch.read,
    preferredContactTime: patch.preferredContactTime,
    configuration,
    configurationData: configuration,
    visualiserSessionId: patch.visualiserSessionId,
    visualiserScreenshot: patch.visualiserScreenshot,
  };
}

function mapQuoteForWrite(quote: QuoteRecord) {
  return {
    id: quote.id,
    leadId: quote.leadId ?? null,
    consultationId: quote.consultationId ?? null,
    clientName: quote.clientName,
    clientEmail: quote.clientEmail ?? '',
    clientPhone: quote.clientPhone ?? '',
    quoteNumber: quote.quoteNumber ?? '',
    status:
      quote.status === 'Requested'
        ? 'requested'
        : quote.status === 'Sent'
          ? 'sent'
          : quote.status.toLowerCase(),
    productIds: quote.productIds,
    productNames: quote.productNames,
    summary: quote.summary,
    amount: quote.amount ?? 0,
    notes: quote.notes ?? '',
    validUntil: quote.validUntil ?? '',
  };
}

function mapQuotePatch(patch: Partial<QuoteRecord>) {
  return {
    leadId: patch.leadId,
    consultationId: patch.consultationId,
    clientName: patch.clientName,
    clientEmail: patch.clientEmail,
    clientPhone: patch.clientPhone,
    quoteNumber: patch.quoteNumber,
    status:
      patch.status === 'Requested'
        ? 'requested'
        : patch.status === 'Sent'
          ? 'sent'
          : patch.status?.toLowerCase(),
    productIds: patch.productIds,
    productNames: patch.productNames,
    summary: patch.summary,
    amount: patch.amount,
    notes: patch.notes,
    validUntil: patch.validUntil,
  };
}

function sortByCreatedDesc<T extends { createdAt?: string }>({ left, right }: { left: T; right: T }) {
  const leftCreated = left.createdAt ? Date.parse(left.createdAt) : 0;
  const rightCreated = right.createdAt ? Date.parse(right.createdAt) : 0;
  return rightCreated - leftCreated;
}

export function subscribeEnquiries(
  onData: (enquiries: Enquiry[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedCollections<Enquiry>(
    [
      {
        key: 'enquiries',
        path: 'enquiries',
        priority: 1,
        map: (enquiry) => normalizeEnquiryRecord(enquiry.id, enquiry),
      },
    ],
    (enquiries) => onData(enquiries.sort((left, right) => sortByCreatedDesc({ left, right }))),
    (error) => {
      console.error('Failed to subscribe to enquiries:', error);
      onError?.('Unable to load enquiries right now.');
    },
  );
}

export function subscribeVisualiserSessions(
  onData: (sessions: VisualiserSession[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<VisualiserSession>(
    'visualiserSessions',
    [],
    (sessions) =>
      onData(
        sessions
          .map((session) => normalizeVisualiserSessionRecord(session.id, session))
          .sort((left, right) => sortByCreatedDesc({ left, right })),
      ),
    (error) => {
      console.error('Failed to subscribe to visualiser sessions:', error);
      onError?.('Unable to load visualiser sessions right now.');
    },
  );
}

export function subscribeConsultations(
  onData: (consultations: Consultation[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Consultation>(
    'consultations',
    [],
    (consultations) =>
      onData(
        consultations
          .map((consultation) =>
            normalizeConsultationRecord(consultation.id, consultation),
          )
          .sort((left, right) => Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt)),
      ),
    (error) => {
      console.error('Failed to subscribe to consultations:', error);
      onError?.('Unable to load consultations right now.');
    },
  );
}

export function subscribeQuotes(
  onData: (quotes: QuoteRecord[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<QuoteRecord>(
    'quotes',
    [],
    (quotes) =>
      onData(
        quotes
          .map((quote) => normalizeQuoteRecord(quote.id, quote))
          .sort((left, right) => sortByCreatedDesc({ left, right })),
      ),
    (error) => {
      console.error('Failed to subscribe to quotes:', error);
      onError?.('Unable to load quotes right now.');
    },
  );
}

export async function createEnquiry(enquiry: Enquiry, user?: UserIdentity | null) {
  await createDocument('enquiries', enquiry.id, mapLeadForWrite(enquiry), user);
}

export async function createConsultation(consultation: Consultation, user?: UserIdentity | null) {
  await createDocument('consultations', consultation.id, consultation, user);
}

export async function createQuote(quote: QuoteRecord, user?: UserIdentity | null) {
  await createDocument('quotes', quote.id, mapQuoteForWrite(quote), user);
}

export async function createConsultationRequest(
  enquiry: Enquiry,
  consultation: Consultation,
  user?: UserIdentity | null,
) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'enquiries', enquiry.id), withCreateAudit(mapLeadForWrite(enquiry), user));
  batch.set(doc(db, 'consultations', consultation.id), withCreateAudit(consultation, user));
  await batch.commit();
}

export async function createQuoteRequest(
  enquiry: Enquiry,
  consultation?: Consultation,
  user?: UserIdentity | null,
) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'enquiries', enquiry.id), withCreateAudit(mapLeadForWrite(enquiry), user));
  if (consultation) {
    batch.set(doc(db, 'consultations', consultation.id), withCreateAudit(consultation, user));
  }
  batch.set(
    doc(db, 'quotes', `${enquiry.id}-quote`),
    withCreateAudit(
      mapQuoteForWrite({
        id: `${enquiry.id}-quote`,
        leadId: enquiry.id,
        consultationId: consultation?.id,
        clientName: enquiry.clientName,
        clientEmail: enquiry.email,
        clientPhone: enquiry.phone,
        status: 'Requested',
        productIds: enquiry.productIds,
        productNames: enquiry.productNames,
        summary: enquiry.configurationData?.productName
          ? `Quote request for ${enquiry.configurationData.productName}`
          : `Quote request for ${enquiry.clientName}`,
        notes:
          enquiry.notes
            .map((note) => note.message)
            .filter(Boolean)
            .join('\n') || undefined,
      }),
      user,
    ),
  );
  await batch.commit();
}

export async function createVisualiserSubmission(
  session: VisualiserSession,
  enquiry: Enquiry,
  consultation?: Consultation,
  user?: UserIdentity | null,
) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'visualiserSessions', session.id), withCreateAudit(session, user));
  batch.set(doc(db, 'enquiries', enquiry.id), withCreateAudit(mapLeadForWrite(enquiry), user));
  if (consultation) {
    batch.set(doc(db, 'consultations', consultation.id), withCreateAudit(consultation, user));
  }
  await batch.commit();
}

export async function updateEnquiry(
  enquiryId: string,
  patch: Partial<Enquiry>,
  user?: UserIdentity | null,
) {
  await upsertDocument('enquiries', enquiryId, mapLeadPatch(patch), user);
}

export async function addEnquiryNote(
  enquiryId: string,
  notes: EnquiryNote[],
  user?: UserIdentity | null,
) {
  await upsertDocument<Enquiry>('enquiries', enquiryId, { notes } as Partial<Enquiry>, user);
}

export async function updateConsultation(
  consultationId: string,
  patch: Partial<Consultation>,
  user?: UserIdentity | null,
) {
  await upsertDocument<Consultation>('consultations', consultationId, patch, user);
}

export async function updateQuote(
  quoteId: string,
  patch: Partial<QuoteRecord>,
  user?: UserIdentity | null,
) {
  await upsertDocument('quotes', quoteId, mapQuotePatch(patch), user);
}

export async function deleteEnquiry(enquiryId: string) {
  await removeDocument('enquiries', enquiryId);
}

export async function deleteConsultation(consultationId: string) {
  await removeDocument('consultations', consultationId);
}

export async function deleteQuote(quoteId: string) {
  await removeDocument('quotes', quoteId);
}

export async function updateVisualiserSessionStatus(
  sessionId: string,
  status: VisualiserSessionStatus,
  user?: UserIdentity | null,
) {
  await upsertDocument<VisualiserSession>('visualiserSessions', sessionId, { status }, user);
}

export async function deleteVisualiserSession(sessionId: string) {
  await removeDocument('visualiserSessions', sessionId);
}
