import { orderBy } from 'firebase/firestore';
import type { AutomationRule, CompanySettings, NotificationTemplate } from '../../../types';
import { emptyCompanySettings } from '../constants';
import type { UserIdentity } from '../firestore';
import {
  createDocument,
  patchDocument,
  removeDocument,
  subscribeCollection,
  subscribeMergedDocument,
  upsertDocument,
} from '../firestore';

export function subscribeAdminCompanySettings(
  onData: (settings: CompanySettings) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedDocument<CompanySettings>(
    [
      { key: 'settings', path: 'settings', id: 'companyProfile', priority: 1 },
    ],
    (settings) => onData(settings ?? emptyCompanySettings),
    (error) => {
      console.error('Failed to subscribe to company settings:', error);
      onError?.('Unable to load company settings right now.');
    },
  );
}

export function subscribeTemplates(
  onData: (templates: NotificationTemplate[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<NotificationTemplate>(
    'templates',
    [orderBy('label', 'asc')],
    onData,
    (error) => {
      console.error('Failed to subscribe to templates:', error);
      onError?.('Unable to load templates right now.');
    },
  );
}

export function subscribeAutomations(
  onData: (automations: AutomationRule[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<AutomationRule>(
    'automations',
    [orderBy('title', 'asc')],
    onData,
    (error) => {
      console.error('Failed to subscribe to automations:', error);
      onError?.('Unable to load automations right now.');
    },
  );
}

export async function updateCompanySettings(
  patch: Partial<CompanySettings>,
  user?: UserIdentity | null,
) {
  await upsertDocument<CompanySettings>('settings', 'companyProfile', patch, user);
}

export async function createTemplate(
  template: NotificationTemplate,
  user?: UserIdentity | null,
) {
  await createDocument('templates', template.id, template, user);
}

export async function updateTemplate(
  templateId: string,
  patch: Partial<NotificationTemplate>,
  user?: UserIdentity | null,
) {
  await patchDocument<NotificationTemplate>('templates', templateId, patch, user);
}

export async function deleteTemplate(templateId: string) {
  await removeDocument('templates', templateId);
}

export async function createAutomation(
  automation: AutomationRule,
  user?: UserIdentity | null,
) {
  await createDocument('automations', automation.id, automation, user);
}

export async function updateAutomation(
  automationId: string,
  patch: Partial<AutomationRule>,
  user?: UserIdentity | null,
) {
  await patchDocument<AutomationRule>('automations', automationId, patch, user);
}

export async function deleteAutomation(automationId: string) {
  await removeDocument('automations', automationId);
}
