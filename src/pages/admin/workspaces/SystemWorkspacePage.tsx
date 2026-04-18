import { useEffect, useMemo, useState } from 'react';
import { AdminButton, AdminEmptyState, AdminModal, AdminPage, AdminPageHeader, AdminStatusChip, AdminSubnav, AdminSurface, AdminSurfaceHeader } from '../../../components/admin/AdminUi';
import { canAccessWorkspace, canTakeConsultations } from '../../../lib/adminAccess';
import { supportedRoles } from '../../../lib/backend/constants';
import { uploadWebsiteMedia } from '../../../lib/backend/services/storage';
import { generateId } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { CompanySettings, NotificationTemplate, TeamMember, TeamRole } from '../../../types';
import { Field, SelectInput, systemTabs, TextArea, TextInput } from './shared';
import { useParams } from 'react-router-dom';
import { WebsiteContentPanel } from './WebsiteContentPanel';
import { AutomationPanel } from './AutomationPanel';

const roleOptions: TeamRole[] = supportedRoles;

const workspaceLabels = {
  'command-center': 'Command center',
  pipeline: 'Pipeline',
  jobs: 'Jobs',
  materials: 'Materials',
  finance: 'Finance',
  products: 'Products',
  system: 'System',
} as const;

const createDefaultMemberForm = () => ({
  name: '',
  role: 'Sales' as TeamRole,
  email: '',
  phone: '',
  isPublicProfile: 'false',
  bio: '',
  avatarUrl: '',
});

const createDefaultTemplateForm = () => ({
  label: '',
  body: '',
});

function createCompanyForm(settings: CompanySettings) {
  return {
    companyName: settings.companyName,
    email: settings.email,
    primaryPhone: settings.primaryPhone,
    secondaryPhone: settings.secondaryPhone,
    whatsappNumber: settings.whatsappNumber,
    address: settings.address,
    instagram: settings.socialHandles.instagram,
    facebook: settings.socialHandles.facebook,
    showroomHoursText: settings.showroomHours.map((slot) => `${slot.day}: ${slot.hours}`).join('\n'),
    leadTimes: { ...settings.defaultLeadTimes },
  };
}

function parseShowroomHours(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [day, ...rest] = line.split(':');
      return {
        day: day.trim(),
        hours: rest.join(':').trim() || 'Closed',
      };
    });
}

export function SystemWorkspacePage() {
  const params = useParams();
  const tab = systemTabs.includes(params.tab as (typeof systemTabs)[number]) ? (params.tab as (typeof systemTabs)[number]) : 'team';
  const companySettings = useTailoredStore((state) => state.companySettings);
  const automationRules = useTailoredStore((state) => state.automationRules);
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const adminMaterials = useTailoredStore((state) => state.adminMaterials);
  const addTeamMember = useTailoredStore((state) => state.addTeamMember);
  const updateTeamMember = useTailoredStore((state) => state.updateTeamMember);
  const disableTeamMember = useTailoredStore((state) => state.disableTeamMember);
  const addNotificationTemplate = useTailoredStore((state) => state.addNotificationTemplate);
  const updateNotificationTemplate = useTailoredStore((state) => state.updateNotificationTemplate);
  const deleteNotificationTemplate = useTailoredStore((state) => state.deleteNotificationTemplate);
  const updateCompanySettings = useTailoredStore((state) => state.updateCompanySettings);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [teamNotice, setTeamNotice] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState(createDefaultMemberForm());
  const [templateForm, setTemplateForm] = useState(createDefaultTemplateForm());
  const [companyForm, setCompanyForm] = useState(createCompanyForm(companySettings));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    setCompanyForm(createCompanyForm(companySettings));
  }, [companySettings]);

  const teamCards = useMemo(() => teamMembers.map((member) => ({
    ...member,
    workspaces: (Object.keys(workspaceLabels) as Array<keyof typeof workspaceLabels>).filter((workspace) => canAccessWorkspace(workspace, member.role)),
    canTakeConsultations: member.status !== 'Disabled' && canTakeConsultations(member.role),
  })), [teamMembers]);

  const createInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'TM';

  const openCreateTeamModal = () => {
    setEditingMemberId(null);
    setMemberForm(createDefaultMemberForm());
    setAvatarFile(null);
    setTeamModalOpen(true);
  };

  const openEditTeamModal = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      isPublicProfile: member.isPublicProfile ? 'true' : 'false',
      bio: member.bio ?? '',
      avatarUrl: member.avatarUrl ?? '',
    });
    setAvatarFile(null);
    setTeamModalOpen(true);
  };

  const openCreateTemplateModal = () => {
    setEditingTemplateId(null);
    setTemplateForm(createDefaultTemplateForm());
    setTemplateModalOpen(true);
  };

  const openEditTemplateModal = (template: NotificationTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      label: template.label,
      body: template.body,
    });
    setTemplateModalOpen(true);
  };

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="System" title="Roles, templates, company profile, website content, and automation governance." description="This workspace explains how access, messaging, public-facing content, and future automation are meant to work, and now includes real management flows for team members, templates, company data, and website content." />

      <AdminSubnav items={[{ label: 'Team & roles', href: '/admin/system/team', active: tab === 'team', count: teamMembers.length }, { label: 'Templates', href: '/admin/system/templates', active: tab === 'templates', count: companySettings.notificationTemplates.length }, { label: 'Company', href: '/admin/system/company', active: tab === 'company' }, { label: 'Website', href: '/admin/system/website', active: tab === 'website' }, { label: 'Automations', href: '/admin/system/automations', active: tab === 'automations', count: automationRules.length }]} />

      {tab === 'team' ? (
        <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
          <AdminSurface>
            <AdminSurfaceHeader title="Team & roles" description="Add people here, then assign them inside the pipeline through owner and designer fields." action={<AdminButton onClick={openCreateTeamModal}>Add team member</AdminButton>} />
            {teamNotice ? <div className="mb-4 rounded-[1.15rem] border border-[#dfc69d] bg-[#fbf6ed] px-4 py-3 text-sm text-tm-warm-gray">{teamNotice}</div> : null}
            <div className="grid gap-4 md:grid-cols-2">
              {teamCards.map((member) => (
                <div key={member.id} className="rounded-[1.35rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-cormorant text-[1.8rem] leading-none tracking-[-0.03em] text-tm-charcoal">{member.name}</p>
                      <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{member.email}</p>
                      <p className="text-sm leading-6 text-tm-warm-gray">{member.phone}</p>
                    </div>
                    <span className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">{member.initials}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AdminStatusChip label={member.role} tone="accent" />
                    <AdminStatusChip label={member.status || 'Active'} tone={member.status === 'Disabled' ? 'danger' : member.canTakeConsultations ? 'success' : 'neutral'} />
                    {member.isPublicProfile ? <AdminStatusChip label="Public profile" tone="success" /> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.workspaces.map((workspace) => <span key={`${member.id}-${workspace}`} className="rounded-full border border-black/8 bg-white px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-tm-warm-gray">{workspaceLabels[workspace]}</span>)}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-tm-warm-gray">{member.bio || (member.canTakeConsultations ? 'This role appears in both lead ownership and consultation assignment flows.' : 'This role can still own leads in the pipeline, but is not shown in the consultation designer picker.')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton tone="ghost" onClick={() => openEditTeamModal(member)}>Edit member</AdminButton>
                    {member.status !== 'Disabled' ? <AdminButton tone="danger" onClick={() => { if (!window.confirm(`Disable access for ${member.name}? They will no longer be able to sign in.`)) return; void disableTeamMember(member.id); }}>Disable access</AdminButton> : null}
                  </div>
                </div>
              ))}
            </div>
          </AdminSurface>

          <div className="space-y-6">
            <AdminSurface>
              <AdminSurfaceHeader title="How access works" description="This answers the biggest operational questions directly in the UI." />
              <div className="space-y-3">
                <InfoCard title="Different UI per role" body="Yes, role-based access is already in place. The sidebar and actions change depending on the role's allowed workspaces and permissions." tone="success" />
                <InfoCard title="Assignments" body="Lead ownership is assigned in Pipeline > Leads. Consultation ownership is assigned in Pipeline > Consultations." tone="accent" />
                <InfoCard title="Login portal" body="There is one shared admin login surface, but access is now driven by Firebase Auth plus role-based permissions and backend rules." tone="warning" />
              </div>
            </AdminSurface>

            <AdminSurface>
              <AdminSurfaceHeader title="Recommended next step" description="Best current setup for a growing operations team." />
              <p className="text-sm leading-6 text-tm-warm-gray">Use one shared internal admin portal for now, with role-based visibility controlling who sees what. Separate per-user auth portals make sense later, once you want audit trails, password resets, and invitation-based onboarding.</p>
            </AdminSurface>
          </div>
        </div>
      ) : null}

      {tab === 'templates' ? (
        <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
          <AdminSurface>
            <AdminSurfaceHeader title="Notification templates" description="Use these as repeatable message starting points for WhatsApp, email, or internal follow-up." action={<AdminButton onClick={openCreateTemplateModal}>Create template</AdminButton>} />
            <div className="space-y-3">
              {companySettings.notificationTemplates.length ? companySettings.notificationTemplates.map((template) => (
                <div key={template.id} className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-tm-charcoal">{template.label}</p>
                    <AdminStatusChip label="Reusable" tone="accent" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{template.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton tone="ghost" onClick={() => openEditTemplateModal(template)}>Edit template</AdminButton>
                    <AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete template ${template.label}? This cannot be undone.`)) return; void deleteNotificationTemplate(template.id); }}>Delete template</AdminButton>
                  </div>
                </div>
              )) : <AdminEmptyState title="No templates yet" body="Create templates for reminders, quote updates, and delivery communication." action={<AdminButton onClick={openCreateTemplateModal}>Create template</AdminButton>} />}
            </div>
          </AdminSurface>

          <div className="space-y-6">
            <AdminSurface>
              <AdminSurfaceHeader title="What templates are for" description="Templates are reusable message shells, not automation rules by themselves." />
              <div className="space-y-3">
                <InfoCard title="Best use case" body="Keep the wording consistent for consultation reminders, quote confirmations, and ready-for-delivery messages." tone="success" />
                <InfoCard title="How a user uses them" body="A sales or operations user can copy the template body into WhatsApp, email, or a future automated send flow." tone="accent" />
                <InfoCard title="Placeholder pattern" body="Use placeholders such as {{name}}, {{piece}}, {{date}}, and {{time}} so the message can be reused quickly." tone="warning" />
              </div>
            </AdminSurface>

            <AdminSurface>
              <AdminSurfaceHeader title="Material language" description="Operational and sales teams should speak about materials consistently." />
              <div className="space-y-3">
                {adminMaterials.slice(0, 4).map((material) => (
                  <div key={material.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
                    <p className="text-sm font-semibold text-tm-charcoal">{material.name}</p>
                    <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{material.description}</p>
                  </div>
                ))}
              </div>
            </AdminSurface>
          </div>
        </div>
      ) : null}

      {tab === 'company' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <AdminSurface>
            <AdminSurfaceHeader title="Company profile" description="These values power website defaults, communications, and team-facing context." action={<AdminButton onClick={() => setCompanyModalOpen(true)}>Edit company profile</AdminButton>} />
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCell label="Company" value={companySettings.companyName} />
              <InfoCell label="Email" value={companySettings.email} />
              <InfoCell label="Primary phone" value={companySettings.primaryPhone} />
              <InfoCell label="WhatsApp" value={companySettings.whatsappNumber} />
              <InfoCell label="Address" value={companySettings.address} />
              <InfoCell label="Secondary phone" value={companySettings.secondaryPhone} />
              <InfoCell label="Instagram" value={companySettings.socialHandles.instagram || 'Not set'} />
              <InfoCell label="Facebook" value={companySettings.socialHandles.facebook || 'Not set'} />
            </div>

            <div className="mt-6">
              <AdminSurfaceHeader title="Default lead times" description="These defaults help keep catalogue expectations consistent across categories." />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(companySettings.defaultLeadTimes).map(([category, leadTime]) => (
                  <InfoCell key={category} label={category} value={leadTime} />
                ))}
              </div>
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSurfaceHeader title="Showroom hours" description="Critical for bookings, call expectations, and website trust." />
            <div className="space-y-3">
              {companySettings.showroomHours.map((slot) => <div key={slot.day} className="flex items-center justify-between rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] px-4 py-4"><span className="text-sm font-medium text-tm-charcoal">{slot.day}</span><span className="text-sm text-tm-warm-gray">{slot.hours}</span></div>)}
            </div>
          </AdminSurface>
        </div>
      ) : null}

      {tab === 'website' ? <WebsiteContentPanel /> : null}

      {tab === 'automations' ? <AutomationPanel /> : null}

      <AdminModal open={teamModalOpen} title={editingMemberId ? 'Edit team member' : 'Add team member'} description={editingMemberId ? 'Update team details, public profile settings, and access role here.' : 'Adding someone here immediately makes them available in role-based access and pipeline assignment flows.'} onClose={() => { setTeamModalOpen(false); setEditingMemberId(null); setAvatarFile(null); }}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const isPublicProfile = memberForm.isPublicProfile === 'true';
            const basePatch = { name: memberForm.name, role: memberForm.role, email: memberForm.email, phone: memberForm.phone, initials: createInitials(memberForm.name), isPublicProfile, bio: memberForm.bio, avatarUrl: memberForm.avatarUrl };

            if (editingMemberId) {
              const uploadedAvatar = avatarFile ? await uploadWebsiteMedia('team-profiles', editingMemberId, 'avatar', avatarFile) : null;
              await updateTeamMember(editingMemberId, { ...basePatch, avatarUrl: uploadedAvatar?.url || memberForm.avatarUrl, avatarPath: uploadedAvatar?.path ?? undefined });
              setTeamNotice(`Updated ${memberForm.name}.`);
            } else {
              const created = await addTeamMember({ id: generateId('team'), name: memberForm.name, role: memberForm.role, email: memberForm.email, phone: memberForm.phone, initials: createInitials(memberForm.name), isPublicProfile, bio: memberForm.bio, avatarUrl: memberForm.avatarUrl });
              if (!created) return;
              if (isPublicProfile || memberForm.bio || memberForm.avatarUrl || avatarFile) {
                const uploadedAvatar = avatarFile ? await uploadWebsiteMedia('team-profiles', created.uid, 'avatar', avatarFile) : null;
                await updateTeamMember(created.uid, { isPublicProfile, bio: memberForm.bio, avatarUrl: uploadedAvatar?.url || memberForm.avatarUrl, avatarPath: uploadedAvatar?.path ?? undefined });
              }
              setTeamNotice(`Account created for ${memberForm.name}. Temporary password: ${created.temporaryPassword}`);
            }

            setMemberForm(createDefaultMemberForm());
            setAvatarFile(null);
            setTeamModalOpen(false);
            setEditingMemberId(null);
          }}
        >
          <Field label="Full name"><TextInput value={memberForm.name} onChange={(event) => setMemberForm((current) => ({ ...current, name: event.target.value }))} required /></Field>
          <Field label="Role"><SelectInput value={memberForm.role} onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value as TeamRole }))}>{roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</SelectInput></Field>
          <Field label="Email"><TextInput type="email" value={memberForm.email} onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))} required /></Field>
          <Field label="Phone"><TextInput value={memberForm.phone} onChange={(event) => setMemberForm((current) => ({ ...current, phone: event.target.value }))} required /></Field>
          <Field label="Public profile"><SelectInput value={memberForm.isPublicProfile} onChange={(event) => setMemberForm((current) => ({ ...current, isPublicProfile: event.target.value }))}><option value="false">Internal only</option><option value="true">Show on website</option></SelectInput></Field>
          <Field label="Avatar URL"><TextInput value={memberForm.avatarUrl} onChange={(event) => setMemberForm((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://..." /></Field>
          <Field label="Avatar file"><TextInput type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} /></Field>
          <Field label="Bio"><TextArea value={memberForm.bio} onChange={(event) => setMemberForm((current) => ({ ...current, bio: event.target.value }))} className="min-h-[120px]" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setTeamModalOpen(false); setEditingMemberId(null); setAvatarFile(null); }}>Cancel</AdminButton><AdminButton type="submit">{editingMemberId ? 'Save changes' : 'Add member'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal open={templateModalOpen} title={editingTemplateId ? 'Edit template' : 'Create template'} description="Templates are reusable copy blocks for reminders, quote follow-up, and delivery communication." onClose={() => { setTemplateModalOpen(false); setEditingTemplateId(null); }}>
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); if (editingTemplateId) { void updateNotificationTemplate(editingTemplateId, { label: templateForm.label, body: templateForm.body }); } else { void addNotificationTemplate({ id: generateId('template'), label: templateForm.label, body: templateForm.body }); } setTemplateForm(createDefaultTemplateForm()); setTemplateModalOpen(false); setEditingTemplateId(null); }}>
          <Field label="Template name"><TextInput value={templateForm.label} onChange={(event) => setTemplateForm((current) => ({ ...current, label: event.target.value }))} required /></Field>
          <Field label="Template body"><TextArea value={templateForm.body} onChange={(event) => setTemplateForm((current) => ({ ...current, body: event.target.value }))} placeholder="Hello {{name}}, this is a reminder for {{date}} at {{time}}..." required /></Field>
          <div className="flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setTemplateModalOpen(false); setEditingTemplateId(null); }}>Cancel</AdminButton><AdminButton type="submit">{editingTemplateId ? 'Save changes' : 'Create template'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal open={companyModalOpen} title="Edit company profile" description="Update the shared business details that power the website and admin communications." onClose={() => setCompanyModalOpen(false)}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void updateCompanySettings({ companyName: companyForm.companyName, email: companyForm.email, primaryPhone: companyForm.primaryPhone, secondaryPhone: companyForm.secondaryPhone, whatsappNumber: companyForm.whatsappNumber, address: companyForm.address, socialHandles: { instagram: companyForm.instagram, facebook: companyForm.facebook }, showroomHours: parseShowroomHours(companyForm.showroomHoursText), defaultLeadTimes: companyForm.leadTimes }); setCompanyModalOpen(false); }}>
          <Field label="Company"><TextInput value={companyForm.companyName} onChange={(event) => setCompanyForm((current) => ({ ...current, companyName: event.target.value }))} required /></Field>
          <Field label="Email"><TextInput type="email" value={companyForm.email} onChange={(event) => setCompanyForm((current) => ({ ...current, email: event.target.value }))} required /></Field>
          <Field label="Primary phone"><TextInput value={companyForm.primaryPhone} onChange={(event) => setCompanyForm((current) => ({ ...current, primaryPhone: event.target.value }))} required /></Field>
          <Field label="Secondary phone"><TextInput value={companyForm.secondaryPhone} onChange={(event) => setCompanyForm((current) => ({ ...current, secondaryPhone: event.target.value }))} /></Field>
          <Field label="WhatsApp"><TextInput value={companyForm.whatsappNumber} onChange={(event) => setCompanyForm((current) => ({ ...current, whatsappNumber: event.target.value }))} /></Field>
          <Field label="Address"><TextInput value={companyForm.address} onChange={(event) => setCompanyForm((current) => ({ ...current, address: event.target.value }))} required /></Field>
          <Field label="Instagram"><TextInput value={companyForm.instagram} onChange={(event) => setCompanyForm((current) => ({ ...current, instagram: event.target.value }))} placeholder="@tailoredmanor" /></Field>
          <Field label="Facebook"><TextInput value={companyForm.facebook} onChange={(event) => setCompanyForm((current) => ({ ...current, facebook: event.target.value }))} placeholder="Tailored Manor" /></Field>
          <Field label="Showroom hours"><TextArea value={companyForm.showroomHoursText} onChange={(event) => setCompanyForm((current) => ({ ...current, showroomHoursText: event.target.value }))} className="min-h-[140px]" placeholder="Monday: 09:00 - 17:00&#10;Tuesday: 09:00 - 17:00" /></Field>
          <div className="space-y-3 sm:col-span-2">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">Default lead times</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(companyForm.leadTimes).map(([category, leadTime]) => (
                <Field key={category} label={category}><TextInput value={leadTime} onChange={(event) => setCompanyForm((current) => ({ ...current, leadTimes: { ...current.leadTimes, [category]: event.target.value } }))} /></Field>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => setCompanyModalOpen(false)}>Cancel</AdminButton><AdminButton type="submit">Save company profile</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-black/7 bg-white px-4 py-4">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</p>
      <p className="mt-3 text-sm leading-6 text-tm-charcoal">{value}</p>
    </div>
  );
}

function InfoCard({ title, body, tone }: { title: string; body: string; tone: 'success' | 'accent' | 'warning' }) {
  const toneClasses = {
    success: 'border-[#c9dfcf] bg-[#f4faf5]',
    accent: 'border-[#dfc69d] bg-[#fbf6ed]',
    warning: 'border-[#ead7b2] bg-[#fff9ef]',
  };

  return (
    <div className={`rounded-[1.25rem] border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-semibold text-tm-charcoal">{title}</p>
      <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{body}</p>
    </div>
  );
}
