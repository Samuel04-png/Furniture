import { doc, orderBy, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import type {
  Consultation,
  Enquiry,
  EnquiryNote,
  VisualiserSession,
  VisualiserSessionStatus,
} from '../../../types';
import type { UserIdentity } from '../firestore';
import {
  normalizeConsultationRecord,
  normalizeEnquiryRecord,
  normalizeVisualiserSessionRecord,
} from '../models/crm';
import {
  createDocument,
  removeDocument,
  subscribeCollection,
  withCreateAudit,
  withUpdateAudit,
} from '../firestore';

export function subscribeEnquiries(
  onData: (enquiries: Enquiry[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<Enquiry>(
    'enquiries',
    [orderBy('createdAt', 'desc')],
    (enquiries) => onData(enquiries.map((enquiry) => normalizeEnquiryRecord(enquiry.id, enquiry))),
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
    [orderBy('submittedAt', 'desc')],
    (sessions) =>
      onData(sessions.map((session) => normalizeVisualiserSessionRecord(session.id, session))),
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
    [orderBy('scheduledAt', 'asc')],
    (consultations) =>
      onData(
        consultations.map((consultation) =>
          normalizeConsultationRecord(consultation.id, consultation),
        ),
      ),
    (error) => {
      console.error('Failed to subscribe to consultations:', error);
      onError?.('Unable to load consultations right now.');
    },
  );
}

export async function createEnquiry(enquiry: Enquiry, user?: UserIdentity | null) {
  await createDocument('enquiries', enquiry.id, enquiry, user);
}

export async function createConsultation(consultation: Consultation, user?: UserIdentity | null) {
  await createDocument('consultations', consultation.id, consultation, user);
}

export async function createConsultationRequest(
  enquiry: Enquiry,
  consultation: Consultation,
  user?: UserIdentity | null,
) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'enquiries', enquiry.id), withCreateAudit(enquiry, user));
  batch.set(doc(db, 'consultations', consultation.id), withCreateAudit(consultation, user));
  await batch.commit();
}

export async function createQuoteRequest(
  enquiry: Enquiry,
  consultation?: Consultation,
  user?: UserIdentity | null,
) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'enquiries', enquiry.id), withCreateAudit(enquiry, user));
  if (consultation) {
    batch.set(doc(db, 'consultations', consultation.id), withCreateAudit(consultation, user));
  }
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
  batch.set(doc(db, 'enquiries', enquiry.id), withCreateAudit(enquiry, user));
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
  await updateDoc(doc(db, 'enquiries', enquiryId), withUpdateAudit(patch, user));
}

export async function addEnquiryNote(
  enquiryId: string,
  notes: EnquiryNote[],
  user?: UserIdentity | null,
) {
  await updateDoc(
    doc(db, 'enquiries', enquiryId),
    withUpdateAudit<Enquiry>({ notes }, user),
  );
}

export async function updateConsultation(
  consultationId: string,
  patch: Partial<Consultation>,
  user?: UserIdentity | null,
) {
  await updateDoc(doc(db, 'consultations', consultationId), withUpdateAudit(patch, user));
}

export async function deleteEnquiry(enquiryId: string) {
  await removeDocument('enquiries', enquiryId);
}

export async function deleteConsultation(consultationId: string) {
  await removeDocument('consultations', consultationId);
}

export async function updateVisualiserSessionStatus(
  sessionId: string,
  status: VisualiserSessionStatus,
  user?: UserIdentity | null,
) {
  await updateDoc(
    doc(db, 'visualiserSessions', sessionId),
    withUpdateAudit<VisualiserSession>({ status }, user),
  );
}

export async function deleteVisualiserSession(sessionId: string) {
  await removeDocument('visualiserSessions', sessionId);
}
