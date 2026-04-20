import { useMemo } from 'react';
import { ArrowUpRight, CircleAlert, Sparkles, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AdminEmptyState,
  AdminLinkButton,
  AdminMetric,
  AdminPage,
  AdminPageHeader,
  AdminStatusChip,
  AdminSurface,
  AdminSurfaceHeader,
} from '../../../components/admin/AdminUi';
import { getAccountingStatusLabel } from '../../../lib/invoices';
import { formatCurrency, formatDate, formatDateTime } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import { getJobNextAction, toneForConsultation, toneForFinance, useActiveAdmin } from './shared';

export function CommandCenterPage() {
  const enquiries = useTailoredStore((state) => state.enquiries);
  const consultations = useTailoredStore((state) => state.consultations);
  const productionOrders = useTailoredStore((state) => state.productionOrders);
  const accountingRecords = useTailoredStore((state) => state.accountingRecords);
  const inventoryItems = useTailoredStore((state) => state.inventoryItems);
  const teamMembers = useTailoredStore((state) => state.teamMembers);
  const activeMember = useActiveAdmin();
  const now = useMemo(() => new Date(), [enquiries.length, consultations.length, productionOrders.length, accountingRecords.length, inventoryItems.length]);
  const startOfToday = useMemo(() => {
    const next = new Date(now);
    next.setHours(0, 0, 0, 0);
    return next;
  }, [now]);
  const invoiceRecords = useMemo(
    () => accountingRecords.filter((record) => record.type === 'Invoice'),
    [accountingRecords],
  );
  const outstandingInvoices = useMemo(
    () =>
      invoiceRecords
        .filter((record) => {
          const label = getAccountingStatusLabel(record);
          return label === 'Unpaid' || label === 'Overdue';
        })
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()),
    [invoiceRecords],
  );
  const overdueInvoices = useMemo(
    () => outstandingInvoices.filter((record) => getAccountingStatusLabel(record) === 'Overdue'),
    [outstandingInvoices],
  );
  const unpaidInvoices = useMemo(
    () => outstandingInvoices.filter((record) => getAccountingStatusLabel(record) === 'Unpaid'),
    [outstandingInvoices],
  );
  const upcomingConsultations = useMemo(
    () =>
      [...consultations]
        .filter((consultation) => new Date(consultation.scheduledAt).getTime() >= startOfToday.getTime())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 4),
    [consultations, startOfToday],
  );
  const activeJobs = useMemo(
    () =>
      productionOrders
        .filter((order) => order.status !== 'Delivered')
        .sort((a, b) => new Date(a.deliveryDate || a.deadline).getTime() - new Date(b.deliveryDate || b.deadline).getTime()),
    [productionOrders],
  );
  const overdueJobs = useMemo(
    () =>
      activeJobs.filter((order) => {
        const dueAt = new Date(order.deliveryDate || order.deadline).getTime();
        return !Number.isNaN(dueAt) && dueAt < startOfToday.getTime();
      }),
    [activeJobs, startOfToday],
  );
  const staleLeads = useMemo(
    () =>
      enquiries.filter((item) => {
        if (item.status === 'Won' || item.status === 'Lost') return false;
        const activityAt = new Date(item.updatedAt || item.createdAt).getTime();
        return !Number.isNaN(activityAt) && now.getTime() - activityAt >= 48 * 60 * 60 * 1000;
      }),
    [enquiries, now],
  );
  const leadsWithoutFirstResponse = useMemo(
    () => enquiries.filter((item) => item.status === 'New' && item.notes.length === 0),
    [enquiries],
  );
  const stockAlerts = useMemo(
    () => inventoryItems.filter((item) => item.onHand <= item.reorderPoint),
    [inventoryItems],
  );
  const nextActions = useMemo(
    () =>
      [
        ...staleLeads.map((item) => ({
          title: `Follow up with ${item.clientName}`,
          meta: `No lead activity since ${formatDateTime(item.updatedAt || item.createdAt)}`,
          href: '/admin/pipeline/leads',
          priorityAt: new Date(item.updatedAt || item.createdAt).getTime(),
        })),
        ...overdueJobs.map((item) => ({
          title: `Rescue ${item.productName}`,
          meta: `${item.clientName} is past due from ${formatDate(item.deliveryDate || item.deadline)}`,
          href: '/admin/jobs/board',
          priorityAt: new Date(item.deliveryDate || item.deadline).getTime(),
        })),
        ...overdueInvoices.map((item) => ({
          title: `Collect ${item.title}`,
          meta: `${item.clientName ?? 'Client record'} is overdue from ${formatDate(item.dueDate)}`,
          href: `/admin/finance/invoices/${item.id}`,
          priorityAt: new Date(item.dueDate).getTime(),
        })),
      ]
        .sort((left, right) => left.priorityAt - right.priorityAt)
        .slice(0, 6),
    [overdueInvoices, overdueJobs, staleLeads],
  );
  const outstandingValue = useMemo(
    () => unpaidInvoices.reduce((sum, item) => sum + item.amount, 0),
    [unpaidInvoices],
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Command Center"
        title="Daily visibility across sales, workshop, stock, and cash."
        description="This workspace is intentionally role-aware and action-first. It surfaces what is late, at risk, or ready to move so the team can work from one calm command layer instead of jumping across disconnected pages."
        actions={
          <>
            <AdminLinkButton to="/admin/pipeline/leads?action=new-lead" tone="primary">New lead</AdminLinkButton>
            <AdminLinkButton to="/admin/pipeline/consultations?action=book-consultation" tone="secondary">Book consultation</AdminLinkButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetric label="Fresh leads" value={String(enquiries.filter((item) => item.status === 'New').length)} meta="Needs first response" tone="warm" />
        <AdminMetric label="Upcoming consults" value={String(upcomingConsultations.length)} meta="Next 4 upcoming appointments" />
        <AdminMetric label="Active jobs" value={String(activeJobs.length)} meta="Not yet delivered" />
        <AdminMetric label="Outstanding cash" value={formatCurrency(outstandingValue)} meta="Unpaid invoice total" tone={outstandingValue > 0 ? 'alert' : 'default'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminSurface>
          <AdminSurfaceHeader
            title={`What ${activeMember?.name?.split(' ')[0] ?? 'your team'} should move next`}
            description="Next best actions collapse urgency, ownership, and workflow state into one clear queue."
          />
          <div className="space-y-3">
            {nextActions.length ? (
              nextActions.map((item) => (
                <Link
                  key={`${item.title}-${item.meta}`}
                  to={item.href}
                  className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4 transition hover:border-black/12 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{item.title}</p>
                    <p className="mt-1 text-sm text-tm-warm-gray">{item.meta}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-tm-gold" />
                </Link>
              ))
            ) : (
              <AdminEmptyState title="No urgent actions right now" body="The queue is clear. Use this moment to review publishing, clean up lead notes, or prep the next delivery run." />
            )}
          </div>
        </AdminSurface>

        <AdminSurface>
          <AdminSurfaceHeader title="Alerts" description="Operational issues that deserve same-day attention." />
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-4">
              <CircleAlert className="mt-0.5 h-4 w-4 text-[#8f1e1e]" />
              <div>
                <p className="text-sm font-semibold text-[#6f1d1d]">{stockAlerts.length} stock alerts</p>
                <p className="mt-1 text-sm text-[#8f5c5c]">Materials at or below reorder point could block a release to production.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-[#dfc69d] bg-[#fbf6ed] px-4 py-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-[#94642d]" />
              <div>
                <p className="text-sm font-semibold text-[#6f4d24]">{overdueInvoices.length} overdue invoices</p>
                <p className="mt-1 text-sm text-[#8a6740]">Prioritize same-day reminders before jobs or deliveries slip.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4">
              <Sparkles className="mt-0.5 h-4 w-4 text-tm-gold" />
              <div>
                <p className="text-sm font-semibold text-tm-charcoal">{leadsWithoutFirstResponse.length} leads without a first response</p>
                <p className="mt-1 text-sm text-tm-warm-gray">These leads are still new and do not yet have a logged response note.</p>
              </div>
            </div>
          </div>
        </AdminSurface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <AdminSurface>
          <AdminSurfaceHeader title="Upcoming consultations" description="What the team needs to prep, arrive for, and complete today." action={<Link to="/admin/pipeline/consultations" className="text-xs font-medium uppercase tracking-[0.2em] text-tm-gold">Open calendar</Link>} />
          <div className="space-y-3">
            {upcomingConsultations.map((consultation) => (
              <div key={consultation.id} className="rounded-[1.3rem] border border-black/7 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{consultation.clientName}</p>
                    <p className="mt-1 text-sm text-tm-warm-gray">{formatDateTime(consultation.scheduledAt)} - {teamMembers.find((member) => member.id === consultation.assignedDesigner)?.name ?? consultation.assignedDesigner}</p>
                  </div>
                  <AdminStatusChip label={consultation.status} tone={toneForConsultation(consultation.status)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{consultation.notes || 'Prepare room measurements, preferred finishes, and decision timeline.'}</p>
              </div>
            ))}
          </div>
        </AdminSurface>

        <AdminSurface>
          <AdminSurfaceHeader title="Stock watch" description="Materials most likely to slow jobs or quotes." />
          <div className="space-y-3">
            {stockAlerts.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-tm-charcoal">{item.name}</p>
                  <p className="mt-1 text-sm text-tm-warm-gray">{item.onHand} {item.unit} on hand - reorder at {item.reorderPoint}</p>
                </div>
                <AdminStatusChip label="Reorder" tone="warning" />
              </div>
            ))}
          </div>
        </AdminSurface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <AdminSurface>
          <AdminSurfaceHeader title="Active jobs" description="Pieces moving through sourcing, workshop, QC, and delivery." />
          <div className="space-y-3">
            {activeJobs.slice(0, 6).map((job) => (
              <div key={job.id} className="rounded-[1.25rem] border border-black/7 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{job.productName}</p>
                    <p className="mt-1 text-sm text-tm-warm-gray">{job.clientName} - due {formatDate(job.deadline)}</p>
                  </div>
                  <AdminStatusChip label={job.status} tone={job.status === 'Quality Check' ? 'warning' : 'accent'} />
                </div>
                <p className="mt-3 text-sm leading-6 text-tm-warm-gray">Next best action: {getJobNextAction(job.status, job.balanceDue)}</p>
              </div>
            ))}
          </div>
        </AdminSurface>

        <AdminSurface>
          <AdminSurfaceHeader title="Outstanding invoices" description="Commercial follow-through tied to live invoice records." />
          <div className="space-y-3">
            {outstandingInvoices.slice(0, 5).map((record) => (
              <div key={record.id} className="rounded-[1.25rem] border border-black/7 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{record.title}</p>
                    <p className="mt-1 text-sm text-tm-warm-gray">{record.clientName ?? 'Client record'} - {formatCurrency(record.amount)}</p>
                  </div>
                  <AdminStatusChip label={getAccountingStatusLabel(record)} tone={toneForFinance(getAccountingStatusLabel(record))} />
                </div>
                <p className="mt-3 text-sm leading-6 text-tm-warm-gray">Due {formatDate(record.dueDate)} - next action: {getAccountingStatusLabel(record) === 'Overdue' ? 'Send reminder now' : 'Confirm receipt plan'}</p>
              </div>
            ))}
          </div>
        </AdminSurface>
      </div>
    </AdminPage>
  );
}
