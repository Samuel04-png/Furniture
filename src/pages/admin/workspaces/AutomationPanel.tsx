import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AdminButton,
  AdminEmptyState,
  AdminModal,
  AdminStatusChip,
  AdminSurface,
  AdminSurfaceHeader,
} from '../../../components/admin/AdminUi';
import { supportedRoles } from '../../../lib/backend/constants';
import { formatDateTime, generateId } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type {
  AutomationEventType,
  AutomationRule,
  NotificationSeverity,
  TeamRole,
} from '../../../types';
import { Field, SelectInput, TextArea, TextInput } from './shared';

const automationEvents: Array<{ value: AutomationEventType; label: string; description: string }> = [
  { value: 'lead.created', label: 'New lead created', description: 'Trigger when a fresh enquiry enters the pipeline.' },
  { value: 'lead.consultation_scheduled', label: 'Lead moved to consultation', description: 'Trigger when an enquiry status changes to consultation scheduled.' },
  { value: 'lead.quote_sent', label: 'Quote sent', description: 'Trigger when an enquiry status changes to quote sent.' },
  { value: 'consultation.scheduled', label: 'Consultation scheduled', description: 'Trigger when a consultation is booked or rescheduled to a new time.' },
  { value: 'finance.overdue', label: 'Finance item overdue', description: 'Trigger when an invoice, deposit, or payable becomes overdue.' },
  { value: 'inventory.low_stock', label: 'Inventory low stock', description: 'Trigger when an inventory item drops below its reorder point.' },
  { value: 'job.stage_changed', label: 'Production stage changed', description: 'Trigger when a production job moves from one stage to another.' },
];

const severityOptions: NotificationSeverity[] = ['info', 'success', 'warning', 'danger'];

const createDefaultAutomationForm = () => ({
  title: '',
  detail: '',
  state: 'Active' as AutomationRule['state'],
  eventType: 'lead.created' as AutomationEventType,
  templateId: '',
  severity: 'info' as NotificationSeverity,
  touchpoints: 'admin inbox',
  targetRoles: ['Owner', 'Admin', 'Sales'] as TeamRole[],
});

function mapSeverityToTone(severity: NotificationSeverity) {
  if (severity === 'success') return 'success';
  if (severity === 'warning') return 'warning';
  if (severity === 'danger') return 'danger';
  return 'accent';
}

export function AutomationPanel() {
  const automationRules = useTailoredStore((state) => state.automationRules);
  const notifications = useTailoredStore((state) => state.notifications);
  const templates = useTailoredStore((state) => state.notificationTemplates);
  const addAutomationRule = useTailoredStore((state) => state.addAutomationRule);
  const updateAutomationRule = useTailoredStore((state) => state.updateAutomationRule);
  const deleteAutomationRule = useTailoredStore((state) => state.deleteAutomationRule);
  const markNotificationRead = useTailoredStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useTailoredStore((state) => state.markAllNotificationsRead);
  const authUser = useTailoredStore((state) => state.authUser);
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const [form, setForm] = useState(createDefaultAutomationForm());

  const unreadCount = useMemo(() => {
    if (!authUser?.uid) return 0;
    return notifications.filter((notification) => !notification.readBy.includes(authUser.uid)).length;
  }, [authUser?.uid, notifications]);

  const openCreateModal = () => {
    setEditingAutomationId(null);
    setForm(createDefaultAutomationForm());
    setAutomationModalOpen(true);
  };

  const openEditModal = (automation: AutomationRule) => {
    setEditingAutomationId(automation.id);
    setForm({
      title: automation.title,
      detail: automation.detail,
      state: automation.state,
      eventType: automation.eventType || 'lead.created',
      templateId: automation.templateId || '',
      severity: automation.severity || 'info',
      touchpoints: automation.touchpoints.join(', '),
      targetRoles: automation.targetRoles?.length ? automation.targetRoles : ['Owner', 'Admin'],
    });
    setAutomationModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminSurface>
          <AdminSurfaceHeader title="Automation rules" description="These rules now drive real backend notifications through Cloud Functions and Firestore." action={<AdminButton onClick={openCreateModal}>Add automation</AdminButton>} />
          <div className="space-y-3">
            {automationRules.length ? automationRules.map((rule) => (
              <div key={rule.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{rule.title}</p>
                    <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{rule.detail}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminStatusChip label={rule.state} tone={rule.state === 'Active' ? 'success' : rule.state === 'Paused' ? 'warning' : 'neutral'} />
                    <AdminStatusChip label={(automationEvents.find((event) => event.value === rule.eventType)?.label || 'Trigger not set').slice(0, 24)} tone="accent" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(rule.targetRoles || []).map((role) => <span key={`${rule.id}-${role}`} className="rounded-full border border-black/8 bg-white px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-tm-warm-gray">{role}</span>)}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rule.touchpoints.map((touchpoint) => <span key={`${rule.id}-${touchpoint}`} className="rounded-full border border-[#dfc69d] bg-[#fbf6ed] px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-tm-warm-gray">{touchpoint}</span>)}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <AdminButton tone="ghost" onClick={() => openEditModal(rule)}>Edit automation</AdminButton>
                  <AdminButton tone={rule.state === 'Active' ? 'secondary' : 'ghost'} onClick={() => void updateAutomationRule(rule.id, { state: rule.state === 'Active' ? 'Paused' : 'Active' })}>{rule.state === 'Active' ? 'Pause rule' : 'Activate rule'}</AdminButton>
                  <AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete automation ${rule.title}? This cannot be undone.`)) return; void deleteAutomationRule(rule.id); }}>Delete automation</AdminButton>
                </div>
              </div>
            )) : <AdminEmptyState title="No automations configured" body="Create the first automation rule to generate real alerts for leads, consultations, jobs, finance, or inventory events." action={<AdminButton onClick={openCreateModal}>Add automation</AdminButton>} />}
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <AdminSurfaceHeader title="Live notification feed" description="These are real notification records created by active automations." action={unreadCount ? <AdminButton tone="secondary" onClick={() => void markAllNotificationsRead()}>Mark all read</AdminButton> : null} />
            <div className="space-y-3">
              {notifications.length ? notifications.slice(0, 12).map((notification) => (
                <div key={notification.id} className="rounded-[1.25rem] border border-black/7 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-tm-charcoal">{notification.title}</p>
                      <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{notification.body}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusChip label={notification.severity} tone={mapSeverityToTone(notification.severity)} />
                      {!notification.readBy.includes(authUser?.uid || '') ? <AdminStatusChip label="Unread" tone="warning" /> : <AdminStatusChip label="Read" tone="neutral" />}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notification.targetRoles.map((role) => <span key={`${notification.id}-${role}`} className="rounded-full border border-black/8 bg-[#fbf7f1] px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-tm-warm-gray">{role}</span>)}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">{formatDateTime(notification.triggeredAt)}</span>
                    {notification.relatedPath ? <Link to={notification.relatedPath} className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-tm-gold">Open workspace</Link> : null}
                    {!notification.readBy.includes(authUser?.uid || '') ? <AdminButton tone="ghost" className="min-h-[2.4rem] px-3 py-2 text-[0.62rem]" onClick={() => void markNotificationRead(notification.id)}>Mark read</AdminButton> : null}
                  </div>
                </div>
              )) : <AdminEmptyState title="No notifications yet" body="Once active automation rules match real events, the feed will populate here automatically." />}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSurfaceHeader title="How this works now" description="This is no longer preview-only." />
            <div className="space-y-3">
              {automationEvents.map((event) => (
                <div key={event.value} className="rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <p className="text-sm font-semibold text-tm-charcoal">{event.label}</p>
                  <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{event.description}</p>
                </div>
              ))}
            </div>
          </AdminSurface>
        </div>
      </div>

      <AdminModal open={automationModalOpen} title={editingAutomationId ? 'Edit automation' : 'Add automation'} description="Choose the backend event, the target roles, and the message template the system should use." onClose={() => { setAutomationModalOpen(false); setEditingAutomationId(null); }}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const payload: AutomationRule = {
            id: editingAutomationId || generateId('automation'),
            title: form.title,
            detail: form.detail,
            state: form.state,
            touchpoints: form.touchpoints.split(',').map((entry) => entry.trim()).filter(Boolean),
            eventType: form.eventType,
            workspace: automationEvents.find((item) => item.value === form.eventType)?.value.startsWith('finance') ? 'finance' : automationEvents.find((item) => item.value === form.eventType)?.value.startsWith('inventory') ? 'materials' : automationEvents.find((item) => item.value === form.eventType)?.value.startsWith('job') ? 'jobs' : 'pipeline',
            templateId: form.templateId || null,
            targetRoles: form.targetRoles,
            severity: form.severity,
          };

          if (editingAutomationId) {
            void updateAutomationRule(editingAutomationId, payload);
          } else {
            void addAutomationRule(payload);
          }

          setAutomationModalOpen(false);
          setEditingAutomationId(null);
          setForm(createDefaultAutomationForm());
        }}>
          <Field label="Automation title"><TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
          <Field label="Event trigger"><SelectInput value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value as AutomationEventType }))}>{automationEvents.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectInput></Field>
          <Field label="Severity"><SelectInput value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value as NotificationSeverity }))}>{severityOptions.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></Field>
          <Field label="State"><SelectInput value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value as AutomationRule['state'] }))}>{['Active', 'Paused', 'Draft'].map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput></Field>
          <Field label="Template"><SelectInput value={form.templateId} onChange={(event) => setForm((current) => ({ ...current, templateId: event.target.value }))}><option value="">Use automation detail</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}</SelectInput></Field>
          <Field label="Touchpoints"><TextInput value={form.touchpoints} onChange={(event) => setForm((current) => ({ ...current, touchpoints: event.target.value }))} placeholder="admin inbox, command center" /></Field>
          <Field label="Automation detail"><TextArea value={form.detail} onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))} className="min-h-[120px]" placeholder="Use placeholders like {{client_name}}, {{product_names}}, {{due_date}}, or {{stage}}." required /></Field>
          <div className="space-y-3 sm:col-span-2">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">Target roles</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {supportedRoles.map((role) => (
                <label key={role} className="flex items-center gap-3 rounded-[1rem] border border-black/7 bg-[#fffdf9] px-4 py-3 text-sm text-tm-charcoal">
                  <input type="checkbox" checked={form.targetRoles.includes(role)} onChange={(event) => setForm((current) => ({ ...current, targetRoles: event.target.checked ? Array.from(new Set([...current.targetRoles, role])) : current.targetRoles.filter((item) => item !== role) }))} />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setAutomationModalOpen(false); setEditingAutomationId(null); setForm(createDefaultAutomationForm()); }}>Cancel</AdminButton><AdminButton type="submit">{editingAutomationId ? 'Save changes' : 'Create automation'}</AdminButton></div>
        </form>
      </AdminModal>
    </div>
  );
}
