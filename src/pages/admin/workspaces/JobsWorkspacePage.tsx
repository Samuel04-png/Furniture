import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminButton, AdminDrawer, AdminEmptyState, AdminMetric, AdminModal, AdminPage, AdminPageHeader, AdminStatusChip, AdminSubnav, AdminSurface, AdminSurfaceHeader } from '../../../components/admin/AdminUi';
import { canPerform } from '../../../lib/adminAccess';
import { formatCurrency, formatDate, generateId } from '../../../lib/utils';
import { productionStages, useTailoredStore } from '../../../store/useTailoredStore';
import type { ProductionOrder } from '../../../types';
import { Field, getJobNextAction, InfoBlock, jobsTabs, SelectInput, TextInput, useActiveAdmin } from './shared';

const createDefaultJobForm = () => ({
  clientName: '',
  productId: '',
  productName: '',
  configuration: '',
  material: '',
  deadline: '',
  craftsman: '',
  status: 'Confirmed Order' as ProductionOrder['status'],
  depositPaid: '0',
  balanceDue: '0',
});

export function JobsWorkspacePage() {
  const params = useParams();
  const tab = jobsTabs.includes(params.tab as (typeof jobsTabs)[number]) ? (params.tab as (typeof jobsTabs)[number]) : 'board';
  const activeMember = useActiveAdmin();
  const productionOrders = useTailoredStore((state) => state.productionOrders);
  const addProductionOrder = useTailoredStore((state) => state.addProductionOrder);
  const updateProductionOrder = useTailoredStore((state) => state.updateProductionOrder);
  const moveProductionOrder = useTailoredStore((state) => state.moveProductionOrder);
  const deleteProductionOrder = useTailoredStore((state) => state.deleteProductionOrder);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(productionOrders[0]?.id);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState(createDefaultJobForm());
  const selectedJob = productionOrders.find((job) => job.id === selectedJobId) ?? productionOrders[0];
  const canAdvanceJobs = canPerform('job.advance', activeMember?.role);
  const canDeleteJobs = canPerform('system.manage', activeMember?.role);
  const sortedJobs = useMemo(() => [...productionOrders].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [productionOrders]);

  const resetForm = () => setForm(createDefaultJobForm());
  const openCreateModal = () => {
    setEditingJobId(null);
    resetForm();
    setJobModalOpen(true);
  };
  const openEditModal = (job: ProductionOrder) => {
    setEditingJobId(job.id);
    setForm({
      clientName: job.clientName,
      productId: job.productId,
      productName: job.productName,
      configuration: job.configuration,
      material: job.material,
      deadline: job.deadline,
      craftsman: job.craftsman,
      status: job.status,
      depositPaid: String(job.depositPaid),
      balanceDue: String(job.balanceDue),
    });
    setJobModalOpen(true);
  };

  useEffect(() => {
    if (!productionOrders.length) {
      setSelectedJobId(undefined);
      return;
    }
    if (!selectedJobId || !productionOrders.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(productionOrders[0].id);
    }
  }, [productionOrders, selectedJobId]);

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Jobs" title="Production control that connects deposits, dependencies, QC, and delivery." description="Jobs collapse production and delivery into one workspace so the workshop can see the real sequence from release through final installation." actions={canAdvanceJobs ? <AdminButton onClick={openCreateModal}>Add job</AdminButton> : null} />

      <AdminSubnav items={[{ label: 'Board', href: '/admin/jobs/board', active: tab === 'board', count: productionOrders.length }, { label: 'Schedule', href: '/admin/jobs/schedule', active: tab === 'schedule', count: productionOrders.length }]} />

      {tab === 'board' ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-4">
            <AdminMetric label="Released jobs" value={String(productionOrders.filter((item) => item.status !== 'Confirmed Order').length)} meta="Already inside sourcing or workshop" />
            <AdminMetric label="QC queue" value={String(productionOrders.filter((item) => item.status === 'Quality Check').length)} meta="Needs quality sign-off" tone="warm" />
            <AdminMetric label="Ready for delivery" value={String(productionOrders.filter((item) => item.status === 'Ready for Delivery').length)} meta="Can be scheduled immediately" />
            <AdminMetric label="Balances due" value={String(productionOrders.filter((item) => item.balanceDue > 0).length)} meta="Track before release or handoff" tone="alert" />
          </div>

          {productionOrders.length ? (
            <div className="hide-scrollbar grid auto-cols-[minmax(288px,1fr)] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-2 scroll-px-1 snap-x snap-mandatory xl:auto-cols-[minmax(300px,1fr)] 2xl:grid-flow-row 2xl:grid-cols-6 2xl:auto-cols-fr">
              {productionStages.map((stage) => (
                <AdminSurface key={stage} className="min-w-[288px] snap-start 2xl:min-w-0">
                  <AdminSurfaceHeader title={stage} description={`${productionOrders.filter((job) => job.status === stage).length} jobs`} />
                  <div className="space-y-3">
                    {productionOrders.filter((job) => job.status === stage).map((job) => (
                      <button type="button" key={job.id} onClick={() => setSelectedJobId(job.id)} className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] ${selectedJob?.id === job.id ? 'border-tm-gold/45 bg-[#fbf6ed]' : 'border-black/7 bg-[#fbf7f1] hover:border-black/12'}`}>
                        <p className="text-sm font-semibold text-tm-charcoal">{job.productName}</p>
                        <p className="mt-1 text-sm text-tm-warm-gray">{job.clientName}</p>
                        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Due {formatDate(job.deadline)}</p>
                        {job.balanceDue > 0 && job.status === 'Confirmed Order' ? <p className="mt-2 text-xs font-medium text-[#8f1e1e]">Deposit gate still open</p> : null}
                      </button>
                    ))}
                  </div>
                </AdminSurface>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="No production jobs yet" body="Add the first job so the board, schedule, and stage controls are driven by real orders." action={canAdvanceJobs ? <AdminButton onClick={openCreateModal}>Add job</AdminButton> : undefined} />
          )}

          <AdminDrawer open={Boolean(selectedJob)} title={selectedJob?.productName ?? 'Job detail'} description={selectedJob ? `${selectedJob.clientName} - due ${formatDate(selectedJob.deadline)}` : undefined} onClose={() => setSelectedJobId(undefined)}>
            {selectedJob ? (
              <div className="space-y-5">
                {canAdvanceJobs ? (
                  <div className="flex flex-wrap gap-2">
                    <AdminButton tone="ghost" onClick={() => openEditModal(selectedJob)}>Edit job</AdminButton>
                    {canDeleteJobs ? (
                      <AdminButton
                        tone="danger"
                        onClick={() => {
                          if (!window.confirm(`Delete ${selectedJob.productName} for ${selectedJob.clientName}? This cannot be undone.`)) return;
                          void deleteProductionOrder(selectedJob.id);
                          setSelectedJobId(undefined);
                        }}
                      >
                        Delete job
                      </AdminButton>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock label="Current stage" value={selectedJob.status} />
                  <InfoBlock label="Next best action" value={getJobNextAction(selectedJob.status, selectedJob.balanceDue)} />
                  <InfoBlock label="Craft lead" value={selectedJob.craftsman} />
                  <InfoBlock label="Material" value={selectedJob.material} />
                  <InfoBlock label="Deposit paid" value={formatCurrency(selectedJob.depositPaid)} />
                  <InfoBlock label="Balance due" value={formatCurrency(selectedJob.balanceDue)} />
                </div>
                <div className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Dependencies & QC</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-tm-warm-gray">
                    <li>Materials readiness should be confirmed before releasing to workshop.</li>
                    <li>Capture progress photos at key milestones for client confidence and internal audit.</li>
                    <li>QC must be checked before a delivery slot is booked.</li>
                  </ul>
                </div>
                {canAdvanceJobs ? <Field label="Advance stage"><SelectInput value={selectedJob.status} onChange={(event) => moveProductionOrder(selectedJob.id, event.target.value as typeof selectedJob.status)}>{productionStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</SelectInput></Field> : null}
              </div>
            ) : null}
          </AdminDrawer>
        </div>
      ) : null}

      {tab === 'schedule' ? (
        <AdminSurface>
          <AdminSurfaceHeader title="Due-date schedule" description="A simpler list view for mobile operators and leadership reviews." action={canAdvanceJobs ? <AdminButton onClick={openCreateModal}>Add job</AdminButton> : null} />
          <div className="space-y-3">
            {sortedJobs.length ? sortedJobs.map((job) => (
              <div key={job.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-tm-charcoal">{job.productName}</p>
                    <p className="mt-1 text-sm text-tm-warm-gray">{job.clientName} - {job.craftsman}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <AdminStatusChip label={job.status} tone={job.status === 'Delivered' ? 'success' : 'accent'} />
                    <span className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Due {formatDate(job.deadline)}</span>
                  </div>
                </div>
                {canAdvanceJobs ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton tone="ghost" onClick={() => openEditModal(job)}>Edit job</AdminButton>
                    {canDeleteJobs ? (
                      <AdminButton
                        tone="danger"
                        onClick={() => {
                          if (!window.confirm(`Delete ${job.productName} for ${job.clientName}? This cannot be undone.`)) return;
                          void deleteProductionOrder(job.id);
                        }}
                      >
                        Delete job
                      </AdminButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )) : <AdminEmptyState title="No jobs scheduled" body="Jobs you add here will appear in both the board and the production schedule." action={canAdvanceJobs ? <AdminButton onClick={openCreateModal}>Add job</AdminButton> : undefined} />}
          </div>
        </AdminSurface>
      ) : null}

      <AdminModal open={jobModalOpen} title={editingJobId ? 'Edit production job' : 'Add production job'} description="Capture the core production fields here so the board, schedule, and QC tracking stay in sync." onClose={() => { setJobModalOpen(false); setEditingJobId(null); resetForm(); }}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const payload = {
              clientName: form.clientName,
              productId: form.productId,
              productName: form.productName,
              configuration: form.configuration,
              material: form.material,
              deadline: form.deadline,
              craftsman: form.craftsman,
              status: form.status,
              depositPaid: Number(form.depositPaid || 0),
              balanceDue: Number(form.balanceDue || 0),
              progressPhotos: [] as string[],
            };
            if (editingJobId) {
              void updateProductionOrder(editingJobId, payload);
            } else {
              const job = { id: generateId('job'), ...payload };
              void addProductionOrder(job);
              setSelectedJobId(job.id);
            }
            setJobModalOpen(false);
            setEditingJobId(null);
            resetForm();
          }}
        >
          <Field label="Client name"><TextInput value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} required /></Field>
          <Field label="Product name"><TextInput value={form.productName} onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))} required /></Field>
          <Field label="Product id"><TextInput value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} placeholder="Optional product record id" /></Field>
          <Field label="Craft lead"><TextInput value={form.craftsman} onChange={(event) => setForm((current) => ({ ...current, craftsman: event.target.value }))} required /></Field>
          <Field label="Configuration"><TextInput value={form.configuration} onChange={(event) => setForm((current) => ({ ...current, configuration: event.target.value }))} placeholder="2.6m sofa, walnut plinth..." required /></Field>
          <Field label="Material"><TextInput value={form.material} onChange={(event) => setForm((current) => ({ ...current, material: event.target.value }))} required /></Field>
          <Field label="Deadline"><TextInput type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} required /></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductionOrder['status'] }))}>{productionStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</SelectInput></Field>
          <Field label="Deposit paid"><TextInput type="number" min={0} value={form.depositPaid} onChange={(event) => setForm((current) => ({ ...current, depositPaid: event.target.value }))} required /></Field>
          <Field label="Balance due"><TextInput type="number" min={0} value={form.balanceDue} onChange={(event) => setForm((current) => ({ ...current, balanceDue: event.target.value }))} required /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setJobModalOpen(false); setEditingJobId(null); resetForm(); }}>Cancel</AdminButton><AdminButton type="submit">{editingJobId ? 'Save changes' : 'Create job'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}
