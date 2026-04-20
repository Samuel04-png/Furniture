import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, MessagesSquare, PackagePlus } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AdminAnchorButton, AdminButton, AdminEmptyState, AdminListRow, AdminMetric, AdminModal, AdminPage, AdminPageHeader, AdminStatusChip, AdminSubnav, AdminSurface, AdminSurfaceHeader, AdminToolbar } from '../../../components/admin/AdminUi';
import { canOwnLeads, canPerform, canTakeConsultations, getAssignableTeamMembers } from '../../../lib/adminAccess';
import { createWhatsAppLink, formatCurrency, formatDateTime, generateId } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { Consultation, Enquiry, EnquirySource } from '../../../types';
import { defaultLeadForm, Field, getLeadNextAction, InfoBlock, pipelineTabLabel, pipelineTabs, safeDigits, SearchField, SelectInput, TextArea, TextInput, toneForConsultation, toneForEnquiry, useActiveAdmin } from './shared';

const leadStatusFilters = ['New', 'Consultation Scheduled', 'Quote Sent', 'Negotiation', 'Won'] as const;

function formatTimeSince(value?: string) {
  if (!value) return 'Unknown timing';

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Unknown timing';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks}w ago`;
  }

  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export function PipelineWorkspacePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMember = useActiveAdmin();
  const enquiries = useTailoredStore((state) => state.enquiries);
  const visualiserSessions = useTailoredStore((state) => state.visualiserSessions);
  const consultations = useTailoredStore((state) => state.consultations);
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const addEnquiry = useTailoredStore((state) => state.addEnquiry);
  const updateEnquiry = useTailoredStore((state) => state.updateEnquiry);
  const deleteEnquiry = useTailoredStore((state) => state.deleteEnquiry);
  const addEnquiryNote = useTailoredStore((state) => state.addEnquiryNote);
  const assignEnquiry = useTailoredStore((state) => state.assignEnquiry);
  const addConsultation = useTailoredStore((state) => state.addConsultation);
  const updateConsultation = useTailoredStore((state) => state.updateConsultation);
  const deleteConsultation = useTailoredStore((state) => state.deleteConsultation);
  const deleteVisualiserSession = useTailoredStore((state) => state.deleteVisualiserSession);
  const updateSessionStatus = useTailoredStore((state) => state.updateVisualiserSessionStatus);
  const tab = pipelineTabs.includes(params.tab as (typeof pipelineTabs)[number]) ? (params.tab as (typeof pipelineTabs)[number]) : 'leads';
  const [search, setSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(enquiries[0]?.id);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(visualiserSessions[0]?.id);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | undefined>(consultations[0]?.id);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingConsultationId, setEditingConsultationId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [leadForm, setLeadForm] = useState(defaultLeadForm());
  const [statusFilter, setStatusFilter] = useState<(typeof leadStatusFilters)[number] | ''>('');
  const leadOwnerOptions = useMemo(
    () => getAssignableTeamMembers(teamMembers, canOwnLeads),
    [teamMembers],
  );
  const designerOptions = useMemo(
    () => getAssignableTeamMembers(teamMembers, canTakeConsultations),
    [teamMembers],
  );
  const [consultationForm, setConsultationForm] = useState(() => ({
    enquiryId: '',
    scheduledAt: '',
    assignedDesigner: designerOptions[0]?.id ?? '',
    notes: '',
  }));

  const clearAction = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-lead') {
      setEditingLeadId(null);
      setLeadForm(defaultLeadForm());
      setLeadModalOpen(true);
    }
    if (action === 'book-consultation') {
      setEditingConsultationId(null);
      setConsultationModalOpen(true);
    }
  }, [searchParams]);

  const filteredLeads = useMemo(
    () =>
      enquiries.filter((enquiry) => {
        const matchesSearch = [
          enquiry.clientName,
          enquiry.email,
          enquiry.phone,
          enquiry.productNames.join(' '),
          enquiry.sourceLabel,
          enquiry.channel,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = !statusFilter || enquiry.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [enquiries, search, statusFilter],
  );
  const filteredSessions = useMemo(() => visualiserSessions.filter((session) => [session.clientName, session.email, session.roomName].join(' ').toLowerCase().includes(search.toLowerCase())), [search, visualiserSessions]);
  const filteredConsultations = useMemo(() => consultations.filter((consultation) => [consultation.clientName, consultation.email, consultation.notes].join(' ').toLowerCase().includes(search.toLowerCase())), [consultations, search]);
  const filteredQuotes = useMemo(
    () =>
      enquiries.filter((item) => {
        const inQuoteStage = ['Quote Sent', 'Negotiation', 'Won'].includes(item.status);
        const matchesSearch = `${item.clientName} ${item.productNames.join(' ')} ${item.sourceLabel ?? item.channel}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return inQuoteStage && matchesSearch && matchesStatus;
      }),
    [enquiries, search, statusFilter],
  );

  const selectedLead = filteredLeads.find((item) => item.id === selectedLeadId) ?? filteredLeads[0];
  const selectedSession = filteredSessions.find((item) => item.id === selectedSessionId) ?? filteredSessions[0];
  const selectedConsultation = filteredConsultations.find((item) => item.id === selectedConsultationId) ?? filteredConsultations[0];
  const selectedLeadConfiguration = selectedLead?.configuration ?? selectedLead?.configurationData;
  const selectedLeadSource = selectedLead?.sourceLabel ?? selectedLead?.channel ?? selectedLead?.type ?? 'Unknown';

  useEffect(() => {
    if (selectedLead) setConsultationForm((current) => ({ ...current, enquiryId: current.enquiryId || selectedLead.id }));
  }, [selectedLead]);

  useEffect(() => {
    setConsultationForm((current) => {
      if (
        current.assignedDesigner &&
        designerOptions.some((member) => member.id === current.assignedDesigner)
      ) {
        return current;
      }

      return {
        ...current,
        assignedDesigner: designerOptions[0]?.id ?? '',
      };
    });
  }, [designerOptions]);

  useEffect(() => {
    if (!filteredLeads.length) {
      if (selectedLeadId) setSelectedLeadId(undefined);
      return;
    }
    if (!filteredLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(filteredLeads[0].id);
    }
  }, [filteredLeads, selectedLeadId]);

  useEffect(() => {
    if (!filteredSessions.length) {
      if (selectedSessionId) setSelectedSessionId(undefined);
      return;
    }
    if (!filteredSessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId(filteredSessions[0].id);
    }
  }, [filteredSessions, selectedSessionId]);

  useEffect(() => {
    if (!filteredConsultations.length) {
      if (selectedConsultationId) setSelectedConsultationId(undefined);
      return;
    }
    if (!filteredConsultations.some((consultation) => consultation.id === selectedConsultationId)) {
      setSelectedConsultationId(filteredConsultations[0].id);
    }
  }, [filteredConsultations, selectedConsultationId]);

  const canEditLead = canPerform('lead.edit', activeMember?.role);
  const canCreateLead = canPerform('lead.create', activeMember?.role);
  const canCreateConsultation = canPerform('consultation.create', activeMember?.role);
  const canManageConsultations = canPerform('consultation.manage', activeMember?.role);
  const canManageSessions = canPerform('session.manage', activeMember?.role);
  const canDeleteRecords = canPerform('system.manage', activeMember?.role);
  const leadWhatsappLink = selectedLead ? createWhatsAppLink(`Hello ${selectedLead.clientName}, thank you for reaching out to Tailored Manor. I am reviewing your enquiry${selectedLead.productNames.length ? ` for ${selectedLead.productNames.join(', ')}` : ''} and can help you with next steps today.`, safeDigits(selectedLead.phone)) : '#';

  const openEditLeadModal = (lead: Enquiry) => {
    setEditingLeadId(lead.id);
    setLeadForm({
      clientName: lead.clientName,
      phone: lead.phone,
      email: lead.email,
      source: lead.type,
      channel: lead.channel,
      productNames: lead.productNames.join(', '),
    });
    setLeadModalOpen(true);
  };

  const openEditConsultationModal = (consultation: Consultation) => {
    setEditingConsultationId(consultation.id);
    setConsultationForm({
      enquiryId: consultation.enquiryId || '',
      scheduledAt: consultation.scheduledAt,
      assignedDesigner: consultation.assignedDesigner,
      notes: consultation.notes,
    });
    setConsultationModalOpen(true);
  };

  const handleLeadSelect = (lead: Enquiry) => {
    setSelectedLeadId(lead.id);
    if (lead.read === false) {
      void updateEnquiry(lead.id, { read: true });
    }
  };

  const statusFilterActive = (value: string) => statusFilter === value;
  const toggleStatusFilter = (value: (typeof leadStatusFilters)[number]) =>
    setStatusFilter((current) => (current === value ? '' : value));

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Pipeline" title="Sales, sessions, and consultation flow in one workspace." description="Leads, visualiser activity, consultations, and quote momentum stay together here so the client story stays intact from first contact to signed-off scope." actions={<>{canCreateLead ? <AdminButton onClick={() => setLeadModalOpen(true)}>Add lead</AdminButton> : null}{canCreateConsultation ? <AdminButton tone="secondary" onClick={() => setConsultationModalOpen(true)}>Book consultation</AdminButton> : null}</>} />

      <AdminSubnav items={[{ label: 'Leads', href: '/admin/pipeline/leads', active: tab === 'leads', count: enquiries.length }, { label: 'Sessions', href: '/admin/pipeline/sessions', active: tab === 'sessions', count: visualiserSessions.length }, { label: 'Consultations', href: '/admin/pipeline/consultations', active: tab === 'consultations', count: consultations.length }, { label: 'Quotes', href: '/admin/pipeline/quotes', active: tab === 'quotes', count: filteredQuotes.length }]} />

      <AdminToolbar>
        <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${pipelineTabLabel(tab).toLowerCase()}, clients, or notes`} />
        <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 scroll-px-1 lg:pb-0">
          {leadStatusFilters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatusFilter(status)}
              className={`shrink-0 rounded-full border px-4 py-2.5 font-dm text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] ${statusFilterActive(status) ? 'border-[#231d18] bg-tm-charcoal text-tm-cream shadow-[0_10px_20px_rgba(12,12,12,0.08)]' : 'border-black/8 bg-white/92 text-tm-charcoal/74 hover:-translate-y-[1px] hover:border-black/12 hover:bg-white hover:text-tm-charcoal hover:shadow-[0_8px_18px_rgba(12,12,12,0.04)]'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </AdminToolbar>

      {tab === 'leads' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]">
          <AdminSurface className="space-y-3">
            <AdminSurfaceHeader title="Lead queue" description="Fast first contact and disciplined follow-up keep premium clients warm." />
            {filteredLeads.length ? filteredLeads.map((enquiry) => <AdminListRow key={enquiry.id} title={enquiry.clientName} subtitle={enquiry.email || enquiry.phone || 'No contact details captured'} meta={`${enquiry.sourceLabel ?? enquiry.channel ?? enquiry.type} - ${formatTimeSince(enquiry.createdAt)}`} active={selectedLead?.id === enquiry.id} onClick={() => handleLeadSelect(enquiry)} className={enquiry.read === false ? 'border-[#dfc69d] bg-[#fff9ee]' : undefined} status={<><AdminStatusChip label={enquiry.status} tone={toneForEnquiry(enquiry.status)} />{enquiry.read === false ? <AdminStatusChip label="New" tone="accent" /> : null}</>} />) : <AdminEmptyState title="No leads match this filter" body="Clear the search or add a new lead to keep the pipeline moving." action={canCreateLead ? <AdminButton onClick={() => setLeadModalOpen(true)}>Add lead</AdminButton> : undefined} />}
          </AdminSurface>

          <AdminSurface>
            {selectedLead ? (
              <>
              <AdminSurfaceHeader title={selectedLead.clientName} description={`${selectedLead.email || 'No email'} - ${selectedLead.phone || 'No phone'} - ${selectedLeadSource}`} action={<div className="flex flex-wrap gap-2"><AdminAnchorButton href={leadWhatsappLink} target="_blank" rel="noreferrer" tone="secondary"><MessagesSquare className="h-4 w-4" />Open WhatsApp reply</AdminAnchorButton>{canEditLead ? <AdminButton tone="ghost" onClick={() => openEditLeadModal(selectedLead)}>Edit lead</AdminButton> : null}{canCreateConsultation ? <AdminButton onClick={() => setConsultationModalOpen(true)}>Book consultation</AdminButton> : null}{canDeleteRecords ? <AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete lead for ${selectedLead.clientName}? This cannot be undone.`)) return; void deleteEnquiry(selectedLead.id); }}>Delete lead</AdminButton> : null}</div>} />

                <div className="grid gap-4 lg:grid-cols-2">
                  <AdminMetric label="Stage" value={selectedLead.status} meta={`Owner: ${teamMembers.find((member) => member.id === selectedLead.assignedTo)?.name ?? 'Unassigned'}`} tone="warm" />
                  <AdminMetric label="Next best action" value={getLeadNextAction(selectedLead)} meta="Designed to reduce response time and avoid stale premium leads." />
                </div>

                <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                  <div className="space-y-4">
                    <div className="rounded-[1.35rem] border border-black/7 bg-[#fbf7f1] p-4">
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Commercial detail</p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Status"><SelectInput value={selectedLead.status} disabled={!canEditLead} onChange={(event) => updateEnquiry(selectedLead.id, { status: event.target.value as Enquiry['status'] })}>{['New', 'Consultation Scheduled', 'Quote Sent', 'Negotiation', 'Won', 'Lost'].map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput></Field>
                        <Field label="Owner"><SelectInput value={selectedLead.assignedTo ?? ''} disabled={!canEditLead || !leadOwnerOptions.length} onChange={(event) => assignEnquiry(selectedLead.id, event.target.value)}><option value="">Unassigned</option>{leadOwnerOptions.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</SelectInput></Field>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <InfoBlock label="Source" value={selectedLeadSource} />
                        <InfoBlock label="Lead type" value={selectedLead.type} />
                        <InfoBlock label="Preferred contact" value={selectedLead.preferredContactTime || 'Not captured'} />
                        <InfoBlock label="Products" value={selectedLead.productNames.join(', ') || 'None yet'} />
                        <InfoBlock label="Channel" value={selectedLead.channel} />
                      </div>
                    </div>

                    {selectedLeadConfiguration ? (
                      <div className="rounded-[1.35rem] border border-black/7 bg-white p-4">
                        <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Configuration</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <InfoBlock label="Product" value={selectedLeadConfiguration.productName || 'Custom design'} />
                          <InfoBlock label="Material" value={selectedLeadConfiguration.materialId || 'Not selected'} />
                          <InfoBlock label="Finish" value={selectedLeadConfiguration.finish || 'Not selected'} />
                          <InfoBlock label="Dimensions" value={`${selectedLeadConfiguration.dimensions?.width || 0} x ${selectedLeadConfiguration.dimensions?.depth || 0} x ${selectedLeadConfiguration.dimensions?.height || 0} cm`} />
                          <InfoBlock label="Quantity" value={String(selectedLeadConfiguration.quantity || 1)} />
                          <InfoBlock label="Estimated price" value={selectedLeadConfiguration.estimatedPrice ? formatCurrency(selectedLeadConfiguration.estimatedPrice) : 'Not captured'} />
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[1.35rem] border border-black/7 bg-white p-4">
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Activity & notes</p>
                      <div className="mt-4 space-y-3">
                        {selectedLead.notes.length ? selectedLead.notes.map((note) => (
                          <div key={note.id} className="rounded-[1.15rem] border border-black/7 bg-[#fbf7f1] px-4 py-4">
                            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-tm-charcoal">{note.author}</p><p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">{formatDateTime(note.createdAt)}</p></div>
                            <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{note.message}</p>
                          </div>
                        )) : <AdminEmptyState title="No notes yet" body="Capture the client's preferences, objections, and timing so anyone on the team can pick this up smoothly." />}
                      </div>
                      {canEditLead ? (
                        <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); if (!noteDraft.trim()) return; addEnquiryNote(selectedLead.id, activeMember?.name ?? 'Admin', noteDraft.trim()); setNoteDraft(''); }}>
                          <Field label="Add note"><TextArea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="What changed, what the client wants, and what should happen next." /></Field>
                          <AdminButton type="submit" tone="secondary">Save note</AdminButton>
                        </form>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <AdminSurface className="p-4">
                      <AdminSurfaceHeader title="Recommended next move" description="Keep the response loop tight and visible." />
                      <div className="rounded-[1.2rem] border border-[#dfc69d] bg-[#fbf6ed] p-4">
                        <p className="text-sm font-semibold text-tm-charcoal">{getLeadNextAction(selectedLead)}</p>
                        <p className="mt-2 text-sm leading-6 text-tm-warm-gray">This lead is currently in <span className="font-semibold text-tm-charcoal">{selectedLead.status}</span>. The best next move is to keep the conversation warm and drive toward consultation or decision.</p>
                      </div>
                    </AdminSurface>

                    <AdminSurface className="p-4">
                      <AdminSurfaceHeader title="Connected records" description="Visualiser, consultation, and commercial trail." />
                      <div className="space-y-3">
                        {selectedLead.visualiserSessionId ? <Link to="/admin/pipeline/sessions" className="flex items-center justify-between rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] px-4 py-4 text-sm font-medium text-tm-charcoal">Open visualiser session<ArrowUpRight className="h-4 w-4 text-tm-gold" /></Link> : null}
                        <Link to="/admin/pipeline/consultations" className="flex items-center justify-between rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] px-4 py-4 text-sm font-medium text-tm-charcoal">Open consultation calendar<ArrowUpRight className="h-4 w-4 text-tm-gold" /></Link>
                        <Link to="/admin/pipeline/quotes" className="flex items-center justify-between rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] px-4 py-4 text-sm font-medium text-tm-charcoal">Open quote queue<ArrowUpRight className="h-4 w-4 text-tm-gold" /></Link>
                      </div>
                    </AdminSurface>
                  </div>
                </div>
              </>
            ) : <AdminEmptyState title="No lead selected" body="Choose a lead to inspect the full client story, notes, owner, and next best action." />}
          </AdminSurface>
        </div>
      ) : null}

      {tab === 'sessions' ? (
        <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSessions.map((session) => {
              const linkedLead = enquiries.find((item) => item.visualiserSessionId === session.id);
              return (
                <button type="button" key={session.id} onClick={() => setSelectedSessionId(session.id)} className={`overflow-hidden rounded-[1.7rem] border bg-white text-left shadow-[0_16px_50px_rgba(12,12,12,0.05)] transition ${selectedSession?.id === session.id ? 'border-tm-gold/45' : 'border-black/7 hover:border-black/12'}`}>
                  <div className="aspect-[4/3] bg-[#ede4d8]"><img src={session.roomPhotoUrl} alt={session.roomName} className="h-full w-full object-cover" /></div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-tm-charcoal">{session.clientName || session.roomName}</p><p className="mt-1 text-sm text-tm-warm-gray">{session.placedItems.length} placed items - {formatDateTime(session.submittedAt)}</p></div><AdminStatusChip label={session.status} tone={session.status === 'Closed' ? 'neutral' : 'accent'} /></div>
                    <p className="text-sm leading-6 text-tm-warm-gray">{linkedLead ? `Linked lead: ${linkedLead.clientName}` : 'No lead linked yet. Convert this session to a consultation-ready opportunity.'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <AdminSurface>
            {selectedSession ? (
              <>
                <AdminSurfaceHeader title={selectedSession.roomName} description={`${selectedSession.clientName || 'Unassigned client'} - ${formatDateTime(selectedSession.submittedAt)}`} />
                <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#ede4d8]"><img src={selectedSession.roomPhotoUrl} alt={selectedSession.roomName} className="h-full w-full object-cover" /></div>
                <div className="mt-5 space-y-4">
                  <Field label="Session status"><SelectInput value={selectedSession.status} disabled={!canManageSessions} onChange={(event) => updateSessionStatus(selectedSession.id, event.target.value as typeof selectedSession.status)}>{['New', 'Contacted', 'Consultation Booked', 'Closed'].map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput></Field>
                  <InfoBlock label="Linked lead" value={enquiries.find((item) => item.visualiserSessionId === selectedSession.id)?.clientName || 'Not linked'} />
                  <InfoBlock label="Suggested next step" value={selectedSession.status === 'New' ? 'Send WhatsApp and book a consultation' : 'Attach this session to an active lead or quote'} />
                  <a href={selectedSession.roomPhotoUrl} download className="inline-flex items-center gap-2 text-sm font-medium text-tm-charcoal"><PackagePlus className="h-4 w-4 text-tm-gold" />Download room output</a>
                  {canDeleteRecords ? <AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete session ${selectedSession.roomName}? This cannot be undone.`)) return; void deleteVisualiserSession(selectedSession.id); }}>Delete session</AdminButton> : null}
                </div>
              </>
            ) : <AdminEmptyState title="No session selected" body="Choose a visualiser session to review the room, linked lead, and handoff status." />}
          </AdminSurface>
        </div>
      ) : null}

      {tab === 'consultations' ? (
        <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
          <AdminSurface>
            <AdminSurfaceHeader title="Consultation agenda" description="A cleaner list view for the team that is easier to scan than a dense month grid." />
              <div className="space-y-3">
                {filteredConsultations.length ? filteredConsultations.slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((consultation) => <AdminListRow key={consultation.id} title={consultation.clientName} subtitle={`${formatDateTime(consultation.scheduledAt)} - ${teamMembers.find((member) => member.id === consultation.assignedDesigner)?.name ?? consultation.assignedDesigner}`} meta={consultation.source} active={selectedConsultation?.id === consultation.id} onClick={() => setSelectedConsultationId(consultation.id)} status={<AdminStatusChip label={consultation.status} tone={toneForConsultation(consultation.status)} />} />) : <AdminEmptyState title="No consultations in view" body="Book a consultation here so the team can see ownership, timing, and next action in one place." action={canCreateConsultation ? <AdminButton onClick={() => setConsultationModalOpen(true)}>Book consultation</AdminButton> : undefined} />}
              </div>
          </AdminSurface>

          <AdminSurface>
            {selectedConsultation ? (
              <>
                <AdminSurfaceHeader title={selectedConsultation.clientName} description={`Scheduled for ${formatDateTime(selectedConsultation.scheduledAt)}`} action={<div className="flex flex-wrap gap-2">{canManageConsultations ? <AdminButton tone="ghost" onClick={() => openEditConsultationModal(selectedConsultation)}>Edit consultation</AdminButton> : null}{canCreateConsultation ? <AdminButton onClick={() => { setEditingConsultationId(null); setConsultationModalOpen(true); }}>Book another</AdminButton> : null}{canDeleteRecords ? <AdminButton tone="danger" onClick={() => { if (!window.confirm(`Delete consultation for ${selectedConsultation.clientName}? This cannot be undone.`)) return; void deleteConsultation(selectedConsultation.id); }}>Delete consultation</AdminButton> : null}</div>} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Status"><SelectInput value={selectedConsultation.status} disabled={!canManageConsultations} onChange={(event) => updateConsultation(selectedConsultation.id, { status: event.target.value as Consultation['status'] })}>{['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput></Field>
                  <Field label="Assigned designer"><SelectInput value={selectedConsultation.assignedDesigner} disabled={!canManageConsultations} onChange={(event) => updateConsultation(selectedConsultation.id, { assignedDesigner: event.target.value })}><option value="">Unassigned</option>{designerOptions.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</SelectInput></Field>
                </div>
                <div className="mt-4 rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4"><p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Outcome framing</p><p className="mt-3 text-sm leading-6 text-tm-warm-gray">{selectedConsultation.status === 'Completed' ? 'Next best action: create or revise the quote within 24 hours while preferences are still fresh.' : 'Next best action: confirm the brief, remind the client, and arrive with finishes and measurements ready.'}</p></div>
                <Field label="Consultation notes"><TextArea value={selectedConsultation.notes} disabled={!canManageConsultations} onChange={(event) => updateConsultation(selectedConsultation.id, { notes: event.target.value })} placeholder="Travel notes, decision criteria, preferred finishes, delivery constraints..." /></Field>
              </>
            ) : <AdminEmptyState title="No consultation selected" body="Choose an appointment to review owner, notes, and next action." />}
          </AdminSurface>
        </div>
      ) : null}

      {tab === 'quotes' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <AdminMetric label="Quote-ready leads" value={String(enquiries.filter((item) => item.status === 'Consultation Scheduled' || item.status === 'Quote Sent').length)} meta="Ready for commercial follow-through" tone="warm" />
          <AdminMetric label="Negotiations live" value={String(enquiries.filter((item) => item.status === 'Negotiation').length)} meta="Likely revision opportunities" />
          <AdminMetric label="Won this cycle" value={String(enquiries.filter((item) => item.status === 'Won').length)} meta="Hand off to jobs and finance" />
          <div className="lg:col-span-3">
            <AdminSurface>
              <AdminSurfaceHeader title="Commercial queue" description="Quotes stay inside the pipeline so sales can manage objections, revisions, and timing in context." />
              <div className="space-y-3">
                {filteredQuotes.length ? filteredQuotes.map((lead) => <div key={lead.id} className="flex flex-col gap-3 rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-tm-charcoal">{lead.clientName}</p><p className="mt-1 text-sm text-tm-warm-gray">{lead.productNames.join(', ') || 'Scope not attached'} - {lead.email}</p></div><div className="flex flex-wrap items-center gap-3"><AdminStatusChip label={lead.status} tone={toneForEnquiry(lead.status)} /><AdminAnchorButton href={createWhatsAppLink(`Hello ${lead.clientName}, I wanted to follow up on your Tailored Manor quotation and see if you would like to review any revisions together.`, safeDigits(lead.phone))} target="_blank" rel="noreferrer" tone="secondary">Open WhatsApp follow-up</AdminAnchorButton></div></div>) : <AdminEmptyState title="No quote activity in view" body="Once consultations are scheduled or quotes are sent, they will appear here for tighter follow-up." />}
              </div>
            </AdminSurface>
          </div>
        </div>
      ) : null}

      <AdminModal open={leadModalOpen} title={editingLeadId ? 'Edit lead' : 'Add lead'} description="Quick capture and edit stay intentionally short so sales can keep the pipeline clean without losing speed." onClose={() => { setLeadModalOpen(false); setEditingLeadId(null); setLeadForm(defaultLeadForm()); clearAction(); }}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const productNames = leadForm.productNames.split(',').map((item) => item.trim()).filter(Boolean); if (editingLeadId) { const existing = enquiries.find((item) => item.id === editingLeadId); if (!existing) return; void updateEnquiry(editingLeadId, { type: leadForm.source, clientName: leadForm.clientName, phone: leadForm.phone, email: leadForm.email, channel: leadForm.channel, sourceLabel: leadForm.channel || existing.sourceLabel || 'Admin Lead', productNames, productIds: existing.productIds.length ? existing.productIds : productNames.map((_, index) => `${editingLeadId}-product-${index + 1}`) }); setSelectedLeadId(editingLeadId); } else { const enquiry: Enquiry = { id: generateId('enquiry'), type: leadForm.source, clientName: leadForm.clientName, phone: leadForm.phone, email: leadForm.email, productIds: [], productNames, status: 'New', assignedTo: activeMember?.id, channel: leadForm.channel, sourceLabel: leadForm.channel || 'Admin Lead', createdAt: new Date().toISOString(), notes: [], preferredContactTime: '', read: false }; addEnquiry(enquiry); setSelectedLeadId(enquiry.id); } setLeadForm(defaultLeadForm()); setLeadModalOpen(false); setEditingLeadId(null); clearAction(); }}>
          <Field label="Client name"><TextInput value={leadForm.clientName} onChange={(event) => setLeadForm((current) => ({ ...current, clientName: event.target.value }))} required /></Field>
          <Field label="Phone"><TextInput value={leadForm.phone} onChange={(event) => setLeadForm((current) => ({ ...current, phone: event.target.value }))} required /></Field>
          <Field label="Email"><TextInput type="email" value={leadForm.email} onChange={(event) => setLeadForm((current) => ({ ...current, email: event.target.value }))} required /></Field>
          <Field label="Source"><SelectInput value={leadForm.source} onChange={(event) => setLeadForm((current) => ({ ...current, source: event.target.value as EnquirySource }))}>{['direct', 'consultation', 'visualiser', 'configurator'].map((source) => <option key={source} value={source}>{source}</option>)}</SelectInput></Field>
          <Field label="Channel"><TextInput value={leadForm.channel} onChange={(event) => setLeadForm((current) => ({ ...current, channel: event.target.value }))} placeholder="Instagram DM, showroom walk-in, website form..." /></Field>
          <Field label="Interested products"><TextInput value={leadForm.productNames} onChange={(event) => setLeadForm((current) => ({ ...current, productNames: event.target.value }))} placeholder="Comma-separated list" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setLeadModalOpen(false); setEditingLeadId(null); setLeadForm(defaultLeadForm()); clearAction(); }}>Cancel</AdminButton><AdminButton type="submit">{editingLeadId ? 'Save changes' : 'Create lead'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal open={consultationModalOpen} title={editingConsultationId ? 'Edit consultation' : 'Book consultation'} description="Booking and editing stay in one focused sheet so scheduling remains fast, visible, and easy to manage." onClose={() => { setConsultationModalOpen(false); setEditingConsultationId(null); setConsultationForm({ enquiryId: selectedLead?.id ?? '', scheduledAt: '', assignedDesigner: designerOptions[0]?.id ?? '', notes: '' }); clearAction(); }}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const lead = enquiries.find((item) => item.id === consultationForm.enquiryId); if (!lead) return; if (editingConsultationId) { void updateConsultation(editingConsultationId, { enquiryId: lead.id, clientName: lead.clientName, phone: lead.phone, email: lead.email, scheduledAt: consultationForm.scheduledAt, assignedDesigner: consultationForm.assignedDesigner, notes: consultationForm.notes, source: lead.type, visualiserSessionId: lead.visualiserSessionId }); setSelectedConsultationId(editingConsultationId); } else { const consultation: Consultation = { id: generateId('consultation'), enquiryId: lead.id, clientName: lead.clientName, phone: lead.phone, email: lead.email, scheduledAt: consultationForm.scheduledAt, assignedDesigner: consultationForm.assignedDesigner, status: 'Scheduled', source: lead.type, notes: consultationForm.notes, visualiserSessionId: lead.visualiserSessionId }; addConsultation(consultation); updateEnquiry(lead.id, { status: 'Consultation Scheduled' }); setSelectedConsultationId(consultation.id); } setConsultationForm({ enquiryId: selectedLead?.id ?? '', scheduledAt: '', assignedDesigner: designerOptions[0]?.id ?? '', notes: '' }); setConsultationModalOpen(false); setEditingConsultationId(null); clearAction(); }}>
          <Field label="Lead"><SelectInput value={consultationForm.enquiryId} onChange={(event) => setConsultationForm((current) => ({ ...current, enquiryId: event.target.value }))}>{enquiries.map((lead) => <option key={lead.id} value={lead.id}>{lead.clientName}</option>)}</SelectInput></Field>
          <Field label="Assigned designer"><SelectInput value={consultationForm.assignedDesigner} onChange={(event) => setConsultationForm((current) => ({ ...current, assignedDesigner: event.target.value }))}><option value="">Unassigned</option>{designerOptions.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</SelectInput></Field>
          <Field label="Date & time"><TextInput type="datetime-local" value={consultationForm.scheduledAt} onChange={(event) => setConsultationForm((current) => ({ ...current, scheduledAt: event.target.value }))} required /></Field>
          <Field label="Reminder notes"><TextInput value={consultationForm.notes} onChange={(event) => setConsultationForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Measurements, moodboards, access notes..." /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setConsultationModalOpen(false); setEditingConsultationId(null); setConsultationForm({ enquiryId: selectedLead?.id ?? '', scheduledAt: '', assignedDesigner: designerOptions[0]?.id ?? '', notes: '' }); clearAction(); }}>Cancel</AdminButton><AdminButton type="submit">{editingConsultationId ? 'Save changes' : 'Confirm consultation'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}
