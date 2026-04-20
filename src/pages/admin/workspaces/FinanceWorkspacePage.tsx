import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AdminButton,
  AdminEmptyState,
  AdminListRow,
  AdminModal,
  AdminPage,
  AdminPageHeader,
  AdminStatusChip,
  AdminSubnav,
  AdminSurface,
  AdminSurfaceHeader,
  AdminToolbar,
} from '../../../components/admin/AdminUi';
import { canPerform } from '../../../lib/adminAccess';
import { getAccountingStatusLabel } from '../../../lib/invoices';
import { formatCurrency, formatDate, generateId } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { AccountingRecord, AccountingStatus, AccountingType } from '../../../types';
import { Field, financeTabLabel, financeTabs, InfoBlock, mapFinanceTab, SearchField, SelectInput, TextInput, toneForFinance, useActiveAdmin } from './shared';

function todayDateInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const createDefaultForm = (tab: (typeof financeTabs)[number]) => ({
  type: mapFinanceTab(tab),
  title: '',
  clientName: '',
  amount: '',
  dueDate: todayDateInputValue(),
  status: 'Draft' as AccountingStatus,
});

export function FinanceWorkspacePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMember = useActiveAdmin();
  const tab = financeTabs.includes(params.tab as (typeof financeTabs)[number]) ? (params.tab as (typeof financeTabs)[number]) : 'invoices';
  const records = useTailoredStore((state) => state.accountingRecords);
  const addAccountingRecord = useTailoredStore((state) => state.addAccountingRecord);
  const updateAccountingRecord = useTailoredStore((state) => state.updateAccountingRecord);
  const deleteAccountingRecord = useTailoredStore((state) => state.deleteAccountingRecord);
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(records[0]?.id);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(createDefaultForm(tab));
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [isUpdatingRecordId, setIsUpdatingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const canEditFinance = canPerform('finance.edit', activeMember?.role);
  const canDeleteFinance = canPerform('system.manage', activeMember?.role);

  if (tab === 'invoices') {
    return <Navigate to="/admin/finance/invoices" replace />;
  }

  const resetForm = () => setForm(createDefaultForm(tab));
  const clearAction = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };
  const openCreateModal = () => {
    setEditingRecordId(null);
    resetForm();
    setFormError('');
    setRecordModalOpen(true);
  };
  const openEditModal = (record: AccountingRecord) => {
    setEditingRecordId(record.id);
    setFormError('');
    setForm({
      type: record.type,
      title: record.title,
      clientName: record.clientName ?? '',
      amount: String(record.amount),
      dueDate: record.dueDate,
      status: record.status,
    });
    setRecordModalOpen(true);
  };

  useEffect(() => {
    setForm((current) => ({ ...current, type: mapFinanceTab(tab) }));
  }, [tab]);

  useEffect(() => {
    if (searchParams.get('action') === 'record-payment') openCreateModal();
  }, [searchParams]);

  const filteredRecords = records.filter((record) => record.type === mapFinanceTab(tab) && [record.title, record.clientName, record.status].join(' ').toLowerCase().includes(search.toLowerCase()));
  const selectedRecord = filteredRecords.find((record) => record.id === selectedRecordId) ?? filteredRecords[0];

  useEffect(() => {
    if (!filteredRecords.length) {
      if (selectedRecordId) setSelectedRecordId(undefined);
      return;
    }
    if (!filteredRecords.some((record) => record.id === selectedRecordId)) {
      setSelectedRecordId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedRecordId]);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Finance"
        title="Staged billing, expenses, and payment follow-through without clutter."
        description="Finance is separated from operations, but still linked to the client and job story. Each record can now be added, edited, or removed from the same workspace."
        actions={canEditFinance ? <AdminButton onClick={openCreateModal}>Add {financeTabLabel(tab).slice(0, -1)}</AdminButton> : null}
      />

      <AdminSubnav
        items={financeTabs.map((item) => ({ label: financeTabLabel(item), href: `/admin/finance/${item}`, active: tab === item, count: records.filter((record) => record.type === mapFinanceTab(item)).length }))}
      />

      <AdminToolbar>
        <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${financeTabLabel(tab).toLowerCase()}`} />
      </AdminToolbar>

      {pageError ? (
        <div className="rounded-[1.2rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#7d2f2f]">
          {pageError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <AdminSurface className="space-y-3">
          <AdminSurfaceHeader title={financeTabLabel(tab)} description="Select a record to inspect status, due date, and linked commercial context." />
          {filteredRecords.length ? (
            filteredRecords.map((record) => (
              <AdminListRow
                key={record.id}
                title={record.title}
                subtitle={`${record.clientName || 'House record'} - ${formatCurrency(record.amount)}`}
                meta={`Due ${formatDate(record.dueDate)}`}
                active={selectedRecord?.id === record.id}
                onClick={() => setSelectedRecordId(record.id)}
                status={<AdminStatusChip label={getAccountingStatusLabel(record)} tone={toneForFinance(getAccountingStatusLabel(record))} />}
              />
            ))
          ) : (
            <AdminEmptyState title={`No ${financeTabLabel(tab).toLowerCase()} in view`} body="Use the create action to add a new record without overloading the reporting screen." action={canEditFinance ? <AdminButton onClick={openCreateModal}>Add record</AdminButton> : undefined} />
          )}
        </AdminSurface>

        <AdminSurface>
          {selectedRecord ? (
            <>
              <AdminSurfaceHeader
                title={selectedRecord.title}
                description={`${selectedRecord.clientName || 'Internal finance record'} - ${formatCurrency(selectedRecord.amount)}`}
                action={
                  canEditFinance ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.status !== 'Paid' ? (
                        <AdminButton
                          tone="secondary"
                          disabled={isUpdatingRecordId === selectedRecord.id || deletingRecordId === selectedRecord.id}
                          onClick={async () => {
                            setPageError('');
                            setIsUpdatingRecordId(selectedRecord.id);
                            try {
                              await updateAccountingRecord(selectedRecord.id, { status: 'Paid' });
                            } catch (error) {
                              console.error('Failed to update finance record status:', error);
                              setPageError('We could not update the payment status right now.');
                            } finally {
                              setIsUpdatingRecordId(null);
                            }
                          }}
                        >
                          {isUpdatingRecordId === selectedRecord.id ? 'Saving...' : 'Mark paid'}
                        </AdminButton>
                      ) : null}
                      <AdminButton tone="ghost" disabled={deletingRecordId === selectedRecord.id} onClick={() => openEditModal(selectedRecord)}>Edit record</AdminButton>
                      {canDeleteFinance ? (
                        <AdminButton
                          tone="danger"
                          disabled={deletingRecordId === selectedRecord.id}
                          onClick={async () => {
                            if (!window.confirm(`Delete ${selectedRecord.title}? This cannot be undone.`)) return;
                            setPageError('');
                            setDeletingRecordId(selectedRecord.id);
                            try {
                              await deleteAccountingRecord(selectedRecord.id);
                              setSelectedRecordId(undefined);
                            } catch (error) {
                              console.error('Failed to delete finance record:', error);
                              setPageError('We could not delete this finance record right now.');
                            } finally {
                              setDeletingRecordId(null);
                            }
                          }}
                        >
                          {deletingRecordId === selectedRecord.id ? 'Deleting...' : 'Delete record'}
                        </AdminButton>
                      ) : null}
                    </div>
                  ) : null
                }
              />
              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Status" value={getAccountingStatusLabel(selectedRecord)} />
                <InfoBlock label="Due date" value={formatDate(selectedRecord.dueDate)} />
                <InfoBlock label="Record type" value={selectedRecord.type} />
              </div>
              <div className="mt-6 rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Next best action</p>
                <p className="mt-3 text-sm leading-6 text-tm-warm-gray">
                  {getAccountingStatusLabel(selectedRecord) === 'Overdue'
                    ? 'Send a reminder today and document the expected receipt date so operations knows whether release can continue.'
                    : getAccountingStatusLabel(selectedRecord) === 'Unpaid'
                      ? 'Confirm the client has seen the record and set a follow-up checkpoint.'
                      : 'Record settled. Keep the linked client and job view clean for reporting.'}
                </p>
              </div>
            </>
          ) : (
            <AdminEmptyState title="No finance record selected" body="Choose an invoice, deposit, expense, or purchase order to inspect details and move the payment state forward." />
          )}
        </AdminSurface>
      </div>

      <AdminModal open={recordModalOpen} title={editingRecordId ? `Edit ${financeTabLabel(tab).slice(0, -1)}` : `New ${financeTabLabel(tab).slice(0, -1)}`} description="Create and edit actions stay in a dedicated modal so reporting stays clean and easy to scan." onClose={() => { setRecordModalOpen(false); setEditingRecordId(null); setFormError(''); clearAction(); }}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedTitle = form.title.trim();
            if (!trimmedTitle) {
              setFormError('Add a title before saving this record.');
              return;
            }
            setFormError('');
            setPageError('');
            setIsSavingRecord(true);
            try {
              const payload = {
                type: form.type as AccountingType,
                title: trimmedTitle,
                clientName: form.clientName.trim(),
                amount: Math.max(0, Number(form.amount || 0)),
                status: form.status,
                dueDate: form.dueDate || todayDateInputValue(),
              };
              if (editingRecordId) {
                await updateAccountingRecord(editingRecordId, payload);
                setSelectedRecordId(editingRecordId);
              } else {
                const recordId = generateId('acct');
                await addAccountingRecord({ id: recordId, ...payload, issuedDate: new Date().toISOString() });
                setSelectedRecordId(recordId);
              }
              resetForm();
              setRecordModalOpen(false);
              setEditingRecordId(null);
              clearAction();
            } catch (error) {
              console.error('Failed to save finance record:', error);
              setFormError('We could not save this finance record right now. Please try again.');
            } finally {
              setIsSavingRecord(false);
            }
          }}
        >
          {formError ? (
            <div className="sm:col-span-2 rounded-[1.1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#7d2f2f]">
              {formError}
            </div>
          ) : null}
          <Field label="Type"><SelectInput value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AccountingType }))}>{['Invoice', 'Deposit', 'Expense', 'Purchase Order'].map((type) => (<option key={type} value={type}>{type}</option>))}</SelectInput></Field>
          <Field label="Title"><TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
          <Field label="Client or supplier"><TextInput value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} /></Field>
          <Field label="Amount"><TextInput type="number" min={0} value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></Field>
          <Field label="Due date"><TextInput type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AccountingStatus }))}>{['Draft', 'Issued', 'Paid', 'Overdue'].map((status) => (<option key={status} value={status}>{status}</option>))}</SelectInput></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingRecord} onClick={() => { setRecordModalOpen(false); setEditingRecordId(null); setFormError(''); clearAction(); }}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingRecord}>{isSavingRecord ? 'Saving...' : editingRecordId ? 'Save changes' : 'Save record'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}
