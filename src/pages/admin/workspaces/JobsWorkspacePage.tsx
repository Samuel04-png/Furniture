import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminButton, AdminDrawer, AdminEmptyState, AdminMetric, AdminModal, AdminPage, AdminPageHeader, AdminStatusChip, AdminSubnav, AdminSurface, AdminSurfaceHeader } from '../../../components/admin/AdminUi';
import { canPerform } from '../../../lib/adminAccess';
import { formatCurrency, formatDate, generateId } from '../../../lib/utils';
import { productionStages, useTailoredStore } from '../../../store/useTailoredStore';
import type { ProductionOrder } from '../../../types';
import { Field, getJobNextAction, InfoBlock, jobsTabs, SelectInput, TextArea, TextInput, useActiveAdmin } from './shared';

function todayDateInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const createDefaultJobForm = () => ({
  title: '',
  clientName: '',
  productId: '',
  productName: '',
  configuration: '',
  material: '',
  deliveryDate: todayDateInputValue(),
  craftsman: '',
  status: 'Confirmed Order' as ProductionOrder['status'],
  depositPaid: '0',
  balanceDue: '0',
  dependencies: '',
  qcNotes: '',
});

export function JobsWorkspacePage() {
  const params = useParams();
  const tab = jobsTabs.includes(params.tab as (typeof jobsTabs)[number]) ? (params.tab as (typeof jobsTabs)[number]) : 'board';
  const activeMember = useActiveAdmin();
  const productionOrders = useTailoredStore((state) => state.productionOrders);
  const adminProducts = useTailoredStore((state) => state.adminProducts);
  const addProductionOrder = useTailoredStore((state) => state.addProductionOrder);
  const updateProductionOrder = useTailoredStore((state) => state.updateProductionOrder);
  const moveProductionOrder = useTailoredStore((state) => state.moveProductionOrder);
  const deleteProductionOrder = useTailoredStore((state) => state.deleteProductionOrder);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(productionOrders[0]?.id);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState(createDefaultJobForm());
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [movingJobId, setMovingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const selectedJob = productionOrders.find((job) => job.id === selectedJobId) ?? productionOrders[0];
  const canAdvanceJobs = canPerform('job.advance', activeMember?.role);
  const canDeleteJobs = canPerform('system.manage', activeMember?.role);
  const productOptions = useMemo(
    () => [...adminProducts].sort((left, right) => left.name.localeCompare(right.name)),
    [adminProducts],
  );
  const sortedJobs = useMemo(
    () => [...productionOrders].sort((a, b) => new Date(a.deliveryDate || a.deadline).getTime() - new Date(b.deliveryDate || b.deadline).getTime()),
    [productionOrders],
  );
  const releasedJobsCount = useMemo(
    () => productionOrders.filter((item) => ['Confirmed Order', 'Materials Sourced', 'In Production'].includes(item.status)).length,
    [productionOrders],
  );
  const qcQueueCount = useMemo(
    () => productionOrders.filter((item) => item.status === 'Quality Check').length,
    [productionOrders],
  );
  const readyForDeliveryCount = useMemo(
    () => productionOrders.filter((item) => item.status === 'Ready for Delivery').length,
    [productionOrders],
  );
  const balancesDueCount = useMemo(
    () => productionOrders.filter((item) => item.balanceDue > 0 && item.status !== 'Delivered').length,
    [productionOrders],
  );

  const resetForm = () => setForm(createDefaultJobForm());
  const openCreateModal = () => {
    setEditingJobId(null);
    resetForm();
    setFormError('');
    setJobModalOpen(true);
  };
  const openEditModal = (job: ProductionOrder) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title ?? job.productName,
      clientName: job.clientName,
      productId: job.productId,
      productName: job.productName,
      configuration: job.configuration,
      material: job.material,
      deliveryDate: job.deliveryDate || job.deadline,
      craftsman: job.craftsman,
      status: job.status,
      depositPaid: String(job.depositPaid),
      balanceDue: String(job.balanceDue),
      dependencies: job.dependencies?.join(', ') ?? '',
      qcNotes: job.qcNotes ?? '',
    });
    setFormError('');
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

      {pageError ? (
        <div className="rounded-[1.2rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#7d2f2f]">
          {pageError}
        </div>
      ) : null}

      {tab === 'board' ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-4">
            <AdminMetric label="Released jobs" value={String(releasedJobsCount)} meta="Inside sourcing or production" />
            <AdminMetric label="QC queue" value={String(qcQueueCount)} meta="Needs quality sign-off" tone="warm" />
            <AdminMetric label="Ready for delivery" value={String(readyForDeliveryCount)} meta="Can be scheduled immediately" />
            <AdminMetric label="Balances due" value={String(balancesDueCount)} meta="Track before handoff" tone="alert" />
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
                        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Due {formatDate(job.deliveryDate || job.deadline)}</p>
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

          <AdminDrawer open={Boolean(selectedJob)} title={selectedJob?.title ?? selectedJob?.productName ?? 'Job detail'} description={selectedJob ? `${selectedJob.clientName} - due ${formatDate(selectedJob.deliveryDate || selectedJob.deadline)}` : undefined} onClose={() => setSelectedJobId(undefined)}>
            {selectedJob ? (
              <div className="space-y-5">
                {canAdvanceJobs ? (
                  <div className="flex flex-wrap gap-2">
                    <AdminButton tone="ghost" disabled={deletingJobId === selectedJob.id} onClick={() => openEditModal(selectedJob)}>Edit job</AdminButton>
                    {canDeleteJobs ? (
                      <AdminButton
                        tone="danger"
                        disabled={deletingJobId === selectedJob.id}
                        onClick={async () => {
                          if (!window.confirm(`Delete ${selectedJob.productName} for ${selectedJob.clientName}? This cannot be undone.`)) return;
                          setPageError('');
                          setDeletingJobId(selectedJob.id);
                          try {
                            await deleteProductionOrder(selectedJob.id);
                            setSelectedJobId(undefined);
                          } catch (error) {
                            console.error('Failed to delete production job:', error);
                            setPageError('We could not delete this job right now.');
                          } finally {
                            setDeletingJobId(null);
                          }
                        }}
                      >
                        {deletingJobId === selectedJob.id ? 'Deleting...' : 'Delete job'}
                      </AdminButton>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock label="Current stage" value={selectedJob.status} />
                  <InfoBlock label="Next best action" value={getJobNextAction(selectedJob.status, selectedJob.balanceDue)} />
                  <InfoBlock label="Craft lead" value={selectedJob.craftsman} />
                  <InfoBlock label="Material" value={selectedJob.material} />
                  <InfoBlock label="Delivery date" value={formatDate(selectedJob.deliveryDate || selectedJob.deadline)} />
                  <InfoBlock label="Deposit paid" value={formatCurrency(selectedJob.depositPaid)} />
                  <InfoBlock label="Balance due" value={formatCurrency(selectedJob.balanceDue)} />
                </div>
                <div className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Dependencies & QC</p>
                  <p className="mt-4 text-sm leading-6 text-tm-warm-gray">
                    {selectedJob.dependencies?.length ? selectedJob.dependencies.join(', ') : 'No dependencies logged yet.'}
                  </p>
                  <p className="mt-4 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">QC notes</p>
                  <p className="mt-3 text-sm leading-6 text-tm-warm-gray">
                    {selectedJob.qcNotes || 'No QC notes have been added yet.'}
                  </p>
                </div>
                {canAdvanceJobs ? <Field label="Advance stage"><SelectInput value={selectedJob.status} disabled={movingJobId === selectedJob.id} onChange={async (event) => { setPageError(''); setMovingJobId(selectedJob.id); try { await moveProductionOrder(selectedJob.id, event.target.value as typeof selectedJob.status); } catch (error) { console.error('Failed to move production job:', error); setPageError('We could not update the job stage right now.'); } finally { setMovingJobId(null); } }}>{productionStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</SelectInput></Field> : null}
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
                    <span className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Due {formatDate(job.deliveryDate || job.deadline)}</span>
                  </div>
                </div>
                {canAdvanceJobs ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton tone="ghost" disabled={deletingJobId === job.id} onClick={() => openEditModal(job)}>Edit job</AdminButton>
                    {canDeleteJobs ? (
                      <AdminButton
                        tone="danger"
                        disabled={deletingJobId === job.id}
                        onClick={async () => {
                          if (!window.confirm(`Delete ${job.productName} for ${job.clientName}? This cannot be undone.`)) return;
                          setPageError('');
                          setDeletingJobId(job.id);
                          try {
                            await deleteProductionOrder(job.id);
                          } catch (error) {
                            console.error('Failed to delete scheduled job:', error);
                            setPageError('We could not delete this job right now.');
                          } finally {
                            setDeletingJobId(null);
                          }
                        }}
                      >
                        {deletingJobId === job.id ? 'Deleting...' : 'Delete job'}
                      </AdminButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )) : <AdminEmptyState title="No jobs scheduled" body="Jobs you add here will appear in both the board and the production schedule." action={canAdvanceJobs ? <AdminButton onClick={openCreateModal}>Add job</AdminButton> : undefined} />}
          </div>
        </AdminSurface>
      ) : null}

      <AdminModal open={jobModalOpen} title={editingJobId ? 'Edit production job' : 'Add production job'} description="Capture the core production fields here so the board, schedule, and QC tracking stay in sync." onClose={() => { setJobModalOpen(false); setEditingJobId(null); setFormError(''); resetForm(); }}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const linkedProduct = productOptions.find((product) => product.id === form.productId);
            const title = form.title.trim() || linkedProduct?.name || form.productName.trim();
            if (!title) {
              setFormError('Add a job title or choose a linked product before saving.');
              return;
            }
            if (!form.clientName.trim()) {
              setFormError('Add a client name before saving this job.');
              return;
            }

            setFormError('');
            setPageError('');
            setIsSavingJob(true);
            try {
              const existingJob = editingJobId ? productionOrders.find((job) => job.id === editingJobId) : undefined;
              const deliveryDate = form.deliveryDate || todayDateInputValue();
              const payload = {
                title,
                clientName: form.clientName.trim(),
                productId: form.productId,
                productName: linkedProduct?.name || form.productName.trim() || title,
                configuration: form.configuration.trim(),
                material: form.material.trim(),
                deadline: deliveryDate,
                deliveryDate,
                craftsman: form.craftsman.trim(),
                status: form.status,
                depositPaid: Math.max(0, Number(form.depositPaid || 0)),
                balanceDue: Math.max(0, Number(form.balanceDue || 0)),
                dependencies: form.dependencies.split(',').map((entry) => entry.trim()).filter(Boolean),
                qcNotes: form.qcNotes.trim() || undefined,
                progressPhotos: existingJob?.progressPhotos ?? [],
              };

              if (editingJobId) {
                await updateProductionOrder(editingJobId, payload);
                setSelectedJobId(editingJobId);
              } else {
                const job = { id: generateId('job'), ...payload };
                await addProductionOrder(job);
                setSelectedJobId(job.id);
              }

              setJobModalOpen(false);
              setEditingJobId(null);
              resetForm();
            } catch (error) {
              console.error('Failed to save production job:', error);
              setFormError('We could not save this production job right now. Please try again.');
            } finally {
              setIsSavingJob(false);
            }
          }}
        >
          {formError ? (
            <div className="sm:col-span-2 rounded-[1.1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#7d2f2f]">
              {formError}
            </div>
          ) : null}
          <Field label="Job title"><TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
          <Field label="Client name"><TextInput value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} required /></Field>
          <Field label="Linked product"><SelectInput value={form.productId} onChange={(event) => { const nextProductId = event.target.value; const nextProduct = productOptions.find((product) => product.id === nextProductId); setForm((current) => ({ ...current, productId: nextProductId, productName: nextProduct?.name ?? current.productName, title: current.title || nextProduct?.name || current.title })); }}><option value="">No linked product</option>{productOptions.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</SelectInput></Field>
          <Field label="Display name"><TextInput value={form.productName} onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))} placeholder="Optional custom product label" /></Field>
          <Field label="Craft lead"><TextInput value={form.craftsman} onChange={(event) => setForm((current) => ({ ...current, craftsman: event.target.value }))} placeholder="Optional production owner" /></Field>
          <Field label="Configuration"><TextInput value={form.configuration} onChange={(event) => setForm((current) => ({ ...current, configuration: event.target.value }))} placeholder="2.6m sofa, walnut plinth..." /></Field>
          <Field label="Material"><TextInput value={form.material} onChange={(event) => setForm((current) => ({ ...current, material: event.target.value }))} placeholder="Optional material or finish" /></Field>
          <Field label="Delivery date"><TextInput type="date" value={form.deliveryDate} onChange={(event) => setForm((current) => ({ ...current, deliveryDate: event.target.value }))} /></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductionOrder['status'] }))}>{productionStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</SelectInput></Field>
          <Field label="Deposit paid"><TextInput type="number" min={0} value={form.depositPaid} onChange={(event) => setForm((current) => ({ ...current, depositPaid: event.target.value }))} /></Field>
          <Field label="Balance due"><TextInput type="number" min={0} value={form.balanceDue} onChange={(event) => setForm((current) => ({ ...current, balanceDue: event.target.value }))} /></Field>
          <div className="sm:col-span-2"><Field label="Dependencies"><TextInput value={form.dependencies} onChange={(event) => setForm((current) => ({ ...current, dependencies: event.target.value }))} placeholder="Materials in, deposit cleared, supplier confirmed" /></Field></div>
          <div className="sm:col-span-2"><Field label="QC notes"><TextArea value={form.qcNotes} onChange={(event) => setForm((current) => ({ ...current, qcNotes: event.target.value }))} placeholder="Optional inspection notes, snags, or delivery prep" /></Field></div>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingJob} onClick={() => { setJobModalOpen(false); setEditingJobId(null); setFormError(''); resetForm(); }}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingJob}>{isSavingJob ? 'Saving...' : editingJobId ? 'Save changes' : 'Create job'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}
