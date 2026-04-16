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

  const upcomingConsultations = [...consultations]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);
  const activeJobs = productionOrders
    .filter((order) => order.status !== 'Delivered')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const outstandingPayments = accountingRecords.filter((record) => record.status === 'Issued' || record.status === 'Overdue');
  const stockAlerts = inventoryItems.filter((item) => item.onHand <= item.reorderPoint);
  const nextActions = [
    ...enquiries
      .filter((item) => item.status === 'New')
      .slice(0, 3)
      .map((item) => ({
        title: `Respond to ${item.clientName}`,
        meta: `Lead came in ${formatDateTime(item.createdAt)}`,
        href: '/admin/pipeline/leads',
      })),
    ...outstandingPayments
      .filter((item) => item.status === 'Overdue')
      .slice(0, 2)
      .map((item) => ({
        title: `Chase ${item.title}`,
        meta: `${item.clientName ?? 'Client record'} is overdue`,
        href: '/admin/finance/invoices',
      })),
    ...activeJobs.slice(0, 2).map((item) => ({
      title: `Review ${item.productName}`,
      meta: `${item.status} - due ${formatDate(item.deadline)}`,
      href: '/admin/jobs/board',
    })),
  ];
  const outstandingValue = outstandingPayments.reduce((sum, item) => sum + item.amount, 0);

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
        <AdminMetric label="Upcoming consults" value={String(upcomingConsultations.length)} meta="Next 4 appointments" />
        <AdminMetric label="Active jobs" value={String(activeJobs.length)} meta="Not yet delivered" />
        <AdminMetric label="Outstanding cash" value={formatCurrency(outstandingValue)} meta="Invoices and deposits due" tone={outstandingValue > 0 ? 'alert' : 'default'} />
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
                <p className="text-sm font-semibold text-[#6f4d24]">{outstandingPayments.filter((item) => item.status === 'Overdue').length} overdue payment records</p>
                <p className="mt-1 text-sm text-[#8a6740]">Prioritize reminders and release gates before production dates slip.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4">
              <Sparkles className="mt-0.5 h-4 w-4 text-tm-gold" />
              <div>
                <p className="text-sm font-semibold text-tm-charcoal">{enquiries.filter((item) => item.status === 'New').length} fresh enquiries within the response window</p>
                <p className="mt-1 text-sm text-tm-warm-gray">Fast first contact is the easiest commercial win in the system.</p>
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
          <AdminSurfaceHeader title="Outstanding payments" description="Commercial follow-through tied to real operational records." />
          <div className="space-y-3">
            {outstandingPayments.slice(0, 5).map((record) => (
              <div key={record.id} className="rounded-[1.25rem] border border-black/7 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{record.title}</p>
                    <p className="mt-1 text-sm text-tm-warm-gray">{record.clientName ?? 'Client record'} - {formatCurrency(record.amount)}</p>
                  </div>
                  <AdminStatusChip label={record.status} tone={toneForFinance(record.status)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-tm-warm-gray">Due {formatDate(record.dueDate)} - next action: {record.status === 'Overdue' ? 'Send reminder now' : 'Confirm receipt plan'}</p>
              </div>
            ))}
          </div>
        </AdminSurface>
      </div>
    </AdminPage>
  );
}
