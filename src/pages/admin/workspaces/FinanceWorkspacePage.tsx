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

const createDefaultForm = (tab: (typeof financeTabs)[number]) => ({
  type: mapFinanceTab(tab),
  title: '',
  clientName: '',
  amount: '',
  dueDate: '',
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
    setRecordModalOpen(true);
  };
  const openEditModal = (record: AccountingRecord) => {
    setEditingRecordId(record.id);
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
                      {selectedRecord.status !== 'Paid' ? <AdminButton tone="secondary" onClick={() => updateAccountingRecord(selectedRecord.id, { status: 'Paid' })}>Mark paid</AdminButton> : null}
                      <AdminButton tone="ghost" onClick={() => openEditModal(selectedRecord)}>Edit record</AdminButton>
                      {canDeleteFinance ? (
                        <AdminButton
                          tone="danger"
                          onClick={() => {
                            if (!window.confirm(`Delete ${selectedRecord.title}? This cannot be undone.`)) return;
                            void deleteAccountingRecord(selectedRecord.id);
                          }}
                        >
                          Delete record
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

      <AdminModal open={recordModalOpen} title={editingRecordId ? `Edit ${financeTabLabel(tab).slice(0, -1)}` : `New ${financeTabLabel(tab).slice(0, -1)}`} description="Create and edit actions stay in a dedicated modal so reporting stays clean and easy to scan." onClose={() => { setRecordModalOpen(false); setEditingRecordId(null); clearAction(); }}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (editingRecordId) {
              void updateAccountingRecord(editingRecordId, { type: form.type as AccountingType, title: form.title, clientName: form.clientName, amount: Number(form.amount || 0), status: form.status, dueDate: form.dueDate });
            } else {
              void addAccountingRecord({ id: generateId('acct'), type: form.type as AccountingType, title: form.title, clientName: form.clientName, amount: Number(form.amount || 0), status: form.status, dueDate: form.dueDate, issuedDate: new Date().toISOString() });
            }
            resetForm();
            setRecordModalOpen(false);
            setEditingRecordId(null);
            clearAction();
          }}
        >
          <Field label="Type"><SelectInput value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AccountingType }))}>{['Invoice', 'Deposit', 'Expense', 'Purchase Order'].map((type) => (<option key={type} value={type}>{type}</option>))}</SelectInput></Field>
          <Field label="Title"><TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
          <Field label="Client or supplier"><TextInput value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} /></Field>
          <Field label="Amount"><TextInput type="number" min={0} value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required /></Field>
          <Field label="Due date"><TextInput type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} required /></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AccountingStatus }))}>{['Draft', 'Issued', 'Paid', 'Overdue'].map((status) => (<option key={status} value={status}>{status}</option>))}</SelectInput></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setRecordModalOpen(false); setEditingRecordId(null); clearAction(); }}>Cancel</AdminButton><AdminButton type="submit">{editingRecordId ? 'Save changes' : 'Save record'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}
