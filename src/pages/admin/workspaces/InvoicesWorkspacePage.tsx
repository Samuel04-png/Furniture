import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  AdminButton,
  AdminEmptyState,
  AdminLinkButton,
  AdminListRow,
  AdminMetric,
  AdminPage,
  AdminPageHeader,
  AdminStatusChip,
  AdminSubnav,
  AdminSurface,
  AdminSurfaceHeader,
  AdminToolbar,
} from '../../../components/admin/AdminUi';
import { canPerform } from '../../../lib/adminAccess';
import {
  calculateInvoiceTotals,
  createInvoiceLineItem,
  getAccountingStatusLabel,
  getInvoiceDate,
  getInvoiceLineItems,
  getInvoiceNumber,
  getNextInvoiceNumber,
  type AccountingStatusLabel,
} from '../../../lib/invoices';
import { downloadInvoicePdf } from '../../../lib/invoicePdf';
import { formatCurrency, formatDate, generateId } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { AccountingRecord, InventoryItem, InvoiceLineItem } from '../../../types';
import {
  Field,
  financeTabLabel,
  financeTabs,
  InfoBlock,
  SearchField,
  SelectInput,
  TextInput,
  toneForFinance,
  useActiveAdmin,
} from './shared';

type InvoiceFormLine = {
  id: string;
  inventoryItemId?: string;
  inventorySearch: string;
  name: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceFormState = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: AccountingRecord['status'];
  taxRate: string;
  feeAmount: string;
  lineItems: InvoiceFormLine[];
};

function todayDateInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function financeNavItems(records: AccountingRecord[]) {
  return financeTabs.map((item) => ({
    label: financeTabLabel(item),
    href: `/admin/finance/${item}`,
    active: item === 'invoices',
    count: records.filter((record) => {
      if (item === 'invoices') return record.type === 'Invoice';
      if (item === 'deposits') return record.type === 'Deposit';
      if (item === 'expenses') return record.type === 'Expense';
      return record.type === 'Purchase Order';
    }).length,
  }));
}

function createInvoiceForm(records: AccountingRecord[], invoice?: AccountingRecord): InvoiceFormState {
  if (invoice) {
    return {
      clientName: invoice.clientName ?? '',
      clientPhone: invoice.clientPhone ?? '',
      clientEmail: invoice.clientEmail ?? '',
      invoiceNumber: getInvoiceNumber(invoice, records),
      invoiceDate: getInvoiceDate(invoice)?.slice(0, 10) ?? todayDateInputValue(),
      dueDate: invoice.dueDate?.slice(0, 10) ?? todayDateInputValue(),
      status: invoice.status,
      taxRate: String(invoice.taxRate ?? 0),
      feeAmount: String(invoice.feeAmount ?? 0),
      lineItems: getInvoiceLineItems(invoice).map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        inventorySearch: item.name,
        name: item.name,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })),
    };
  }

  return {
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    invoiceNumber: getNextInvoiceNumber(records),
    invoiceDate: todayDateInputValue(),
    dueDate: todayDateInputValue(),
    status: 'Issued',
    taxRate: '0',
    feeAmount: '0',
    lineItems: [
      {
        ...createInvoiceLineItem(),
        inventorySearch: '',
        quantity: '1',
        unitPrice: '0',
      },
    ],
  };
}

function parseFormLineItems(lineItems: InvoiceFormLine[]): InvoiceLineItem[] {
  return lineItems
    .filter((item) => item.name.trim())
    .map((item) => ({
      id: item.id,
      inventoryItemId: item.inventoryItemId,
      name: item.name.trim(),
      quantity: Math.max(1, Number(item.quantity || 0)),
      unitPrice: Math.max(0, Number(item.unitPrice || 0)),
    }));
}

function formatStatusLabel(label: AccountingStatusLabel) {
  return label === 'Unpaid' ? 'Unpaid' : label;
}

export function InvoicesWorkspacePage() {
  const navigate = useNavigate();
  const activeMember = useActiveAdmin();
  const records = useTailoredStore((state) => state.accountingRecords);
  const [search, setSearch] = useState('');
  const canEditFinance = canPerform('finance.edit', activeMember?.role);
  const invoices = useMemo(() => records.filter((record) => record.type === 'Invoice'), [records]);
  const filteredInvoices = useMemo(
    () =>
      invoices.filter((record) =>
        [
          getInvoiceNumber(record, records),
          record.clientName,
          record.clientEmail,
          record.clientPhone,
          record.title,
          getAccountingStatusLabel(record),
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [invoices, records, search],
  );
  const unpaidInvoices = invoices.filter((record) => getAccountingStatusLabel(record) === 'Unpaid');
  const overdueInvoices = invoices.filter((record) => getAccountingStatusLabel(record) === 'Overdue');
  const totalInvoiceValue = invoices.reduce((sum, record) => sum + record.amount, 0);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Finance"
        title="Invoices now live in a dedicated workspace with their own records and pages."
        description="The invoice flow is no longer trapped inside a modal. Each invoice can be created on its own page, opened individually, and exported as a clean PDF while the rest of finance keeps using the same live accounting store."
        actions={
          canEditFinance ? (
            <AdminLinkButton to="/admin/finance/invoices/new" tone="primary">
              <Plus className="h-4 w-4" />
              New invoice
            </AdminLinkButton>
          ) : null
        }
      />

      <AdminSubnav items={financeNavItems(records)} />

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetric label="Invoices" value={String(invoices.length)} meta="All saved invoice records" />
        <AdminMetric label="Unpaid" value={String(unpaidInvoices.length)} meta="Awaiting settlement" tone="warm" />
        <AdminMetric label="Overdue" value={String(overdueInvoices.length)} meta="Needs follow-up" tone={overdueInvoices.length ? 'alert' : 'default'} />
        <AdminMetric label="Invoice value" value={formatCurrency(totalInvoiceValue)} meta="Grand total across invoices" />
      </div>

      <AdminSurface className="space-y-4">
        <AdminSurfaceHeader
          title="Invoice list"
          description="Open any invoice to review the document view, download its PDF, and update payment status."
          action={canEditFinance ? <AdminLinkButton to="/admin/finance/invoices/new" tone="secondary">Create invoice</AdminLinkButton> : null}
        />

        <AdminToolbar>
          <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoices, clients, contacts, or status" />
        </AdminToolbar>

        <div className="space-y-3">
          {filteredInvoices.length ? (
            filteredInvoices.map((record) => {
              const statusLabel = getAccountingStatusLabel(record);
              const invoiceNumber = getInvoiceNumber(record, records);
              return (
                <AdminListRow
                  key={record.id}
                  title={invoiceNumber}
                  subtitle={`${record.clientName || 'Client not captured'} - ${formatCurrency(record.amount)}`}
                  meta={`Issued ${formatDate(getInvoiceDate(record) || record.issuedDate)} - Due ${formatDate(record.dueDate)}`}
                  onClick={() => navigate(`/admin/finance/invoices/${record.id}`)}
                  status={<AdminStatusChip label={formatStatusLabel(statusLabel)} tone={toneForFinance(statusLabel)} />}
                />
              );
            })
          ) : (
            <AdminEmptyState
              title="No invoices in view"
              body="Create a new invoice to start using the dedicated document flow, line items, and PDF export."
              action={canEditFinance ? <AdminLinkButton to="/admin/finance/invoices/new">Create invoice</AdminLinkButton> : undefined}
            />
          )}
        </div>
      </AdminSurface>
    </AdminPage>
  );
}

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const activeMember = useActiveAdmin();
  const records = useTailoredStore((state) => state.accountingRecords);
  const companySettings = useTailoredStore((state) => state.companySettings);
  const updateAccountingRecord = useTailoredStore((state) => state.updateAccountingRecord);
  const deleteAccountingRecord = useTailoredStore((state) => state.deleteAccountingRecord);
  const canEditFinance = canPerform('finance.edit', activeMember?.role);
  const canDeleteFinance = canPerform('system.manage', activeMember?.role);
  const [pageError, setPageError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const invoice = records.find((record) => record.id === invoiceId && record.type === 'Invoice');

  if (!invoice) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="Finance"
          title="Invoice not found"
          description="The invoice you tried to open is missing or is no longer an invoice record."
          actions={<AdminLinkButton to="/admin/finance/invoices" tone="secondary"><ArrowLeft className="h-4 w-4" />Back to invoices</AdminLinkButton>}
        />
        <AdminEmptyState title="Missing invoice" body="Return to the invoice list and choose another record." />
      </AdminPage>
    );
  }

  const invoiceNumber = getInvoiceNumber(invoice, records);
  const statusLabel = getAccountingStatusLabel(invoice);
  const lineItems = getInvoiceLineItems(invoice);
  const totals = calculateInvoiceTotals(lineItems, invoice.taxRate ?? 0, invoice.feeAmount ?? 0);
  const invoiceDate = getInvoiceDate(invoice) || invoice.issuedDate;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Finance"
        title={invoiceNumber}
        description={`${invoice.clientName || 'Client not captured'} - ${formatCurrency(invoice.amount)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminLinkButton to="/admin/finance/invoices" tone="ghost"><ArrowLeft className="h-4 w-4" />All invoices</AdminLinkButton>
            <AdminButton
              type="button"
              tone="secondary"
              onClick={() =>
                downloadInvoicePdf({
                  invoice,
                  records,
                  companySettings,
                })
              }
            >
              <Download className="h-4 w-4" />
              Download PDF
            </AdminButton>
            {canEditFinance ? <AdminLinkButton to={`/admin/finance/invoices/${invoice.id}/edit`} tone="ghost">Edit invoice</AdminLinkButton> : null}
            {canEditFinance && statusLabel !== 'Paid' ? (
              <AdminButton
                type="button"
                disabled={isUpdatingStatus || isDeletingInvoice}
                onClick={async () => {
                  setPageError('');
                  setIsUpdatingStatus(true);
                  try {
                    await updateAccountingRecord(invoice.id, { status: 'Paid' });
                  } catch (error) {
                    console.error('Failed to mark invoice as paid:', error);
                    setPageError('We could not update this invoice right now.');
                  } finally {
                    setIsUpdatingStatus(false);
                  }
                }}
              >
                {isUpdatingStatus ? 'Saving...' : 'Mark paid'}
              </AdminButton>
            ) : null}
            {canDeleteFinance ? (
              <AdminButton
                type="button"
                tone="danger"
                disabled={isDeletingInvoice}
                onClick={async () => {
                  if (!window.confirm(`Delete ${invoiceNumber}? This cannot be undone.`)) return;
                  setPageError('');
                  setIsDeletingInvoice(true);
                  try {
                    await deleteAccountingRecord(invoice.id);
                    navigate('/admin/finance/invoices');
                  } catch (error) {
                    console.error('Failed to delete invoice:', error);
                    setPageError('We could not delete this invoice right now.');
                  } finally {
                    setIsDeletingInvoice(false);
                  }
                }}
              >
                {isDeletingInvoice ? 'Deleting...' : 'Delete invoice'}
              </AdminButton>
            ) : null}
          </div>
        }
      />

      <AdminSubnav items={financeNavItems(records)} />

      {pageError ? (
        <div className="rounded-[1.2rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#7d2f2f]">
          {pageError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <InvoicePaper
          companyName={companySettings.companyName || 'Tailored Manor'}
          companyAddress={companySettings.address}
          companyEmail={companySettings.email}
          companyPhone={companySettings.primaryPhone || companySettings.whatsappNumber}
          invoiceNumber={invoiceNumber}
          invoiceDate={invoiceDate}
          dueDate={invoice.dueDate}
          clientName={invoice.clientName}
          clientPhone={invoice.clientPhone}
          clientEmail={invoice.clientEmail}
          lineItems={lineItems}
          statusLabel={statusLabel}
          subtotal={invoice.subtotal ?? totals.subtotal}
          taxRate={invoice.taxRate ?? totals.taxRate}
          taxAmount={invoice.taxAmount ?? totals.taxAmount}
          feeAmount={invoice.feeAmount ?? totals.feeAmount}
          total={invoice.amount || totals.total}
        />

        <div className="space-y-6">
          <AdminSurface>
            <AdminSurfaceHeader title="Invoice summary" description="Core billing fields saved with this record." />
            <div className="grid gap-4">
              <InfoBlock label="Status" value={formatStatusLabel(statusLabel)} />
              <InfoBlock label="Invoice date" value={formatDate(invoiceDate)} />
              <InfoBlock label="Due date" value={formatDate(invoice.dueDate)} />
              <InfoBlock label="Client email" value={invoice.clientEmail || 'Not captured'} />
              <InfoBlock label="Client phone" value={invoice.clientPhone || 'Not captured'} />
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSurfaceHeader title="Amounts" description="Real totals based on saved line items, taxes, and fees." />
            <div className="space-y-3">
              <InfoBlock label="Subtotal" value={formatCurrency(invoice.subtotal ?? totals.subtotal)} />
              <InfoBlock label="Tax amount" value={formatCurrency(invoice.taxAmount ?? totals.taxAmount)} />
              <InfoBlock label="Fees" value={formatCurrency(invoice.feeAmount ?? totals.feeAmount)} />
              <InfoBlock label="Grand total" value={formatCurrency(invoice.amount || totals.total)} />
            </div>
          </AdminSurface>
        </div>
      </div>
    </AdminPage>
  );
}

export function InvoiceEditorPage() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const activeMember = useActiveAdmin();
  const records = useTailoredStore((state) => state.accountingRecords);
  const companySettings = useTailoredStore((state) => state.companySettings);
  const inventoryItems = useTailoredStore((state) => state.inventoryItems);
  const addAccountingRecord = useTailoredStore((state) => state.addAccountingRecord);
  const updateAccountingRecord = useTailoredStore((state) => state.updateAccountingRecord);
  const canEditFinance = canPerform('finance.edit', activeMember?.role);
  const existingInvoice = records.find((record) => record.id === invoiceId && record.type === 'Invoice');
  const isEditing = Boolean(invoiceId);
  const initializationKeyRef = useRef<string | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(createInvoiceForm(records));
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inventoryById = useMemo(
    () =>
      new Map(
        inventoryItems.map((item) => [item.id, item]),
      ),
    [inventoryItems],
  );
  const sortedInventory = useMemo(
    () => [...inventoryItems].sort((left, right) => left.name.localeCompare(right.name)),
    [inventoryItems],
  );

  useEffect(() => {
    if (isEditing && !existingInvoice) return;

    const nextKey = isEditing ? existingInvoice?.id ?? 'missing' : 'new';
    if (initializationKeyRef.current === nextKey) return;

    setForm(createInvoiceForm(records, existingInvoice));
    initializationKeyRef.current = nextKey;
  }, [existingInvoice, isEditing, records]);

  useEffect(() => {
    if (isEditing) return;
    const pristine =
      !form.clientName &&
      !form.clientPhone &&
      !form.clientEmail &&
      form.lineItems.length === 1 &&
      !form.lineItems[0]?.name &&
      form.lineItems[0]?.quantity === '1' &&
      Number(form.lineItems[0]?.unitPrice || 0) === 0;

    if (!pristine) return;

    const nextInvoiceNumber = getNextInvoiceNumber(records);
    if (form.invoiceNumber === nextInvoiceNumber) return;
    setForm((current) => ({ ...current, invoiceNumber: nextInvoiceNumber }));
  }, [form.clientEmail, form.clientName, form.clientPhone, form.invoiceNumber, form.lineItems, isEditing, records]);

  const parsedLineItems = useMemo(() => parseFormLineItems(form.lineItems), [form.lineItems]);
  const totals = useMemo(
    () => calculateInvoiceTotals(parsedLineItems, Number(form.taxRate || 0), Number(form.feeAmount || 0)),
    [form.feeAmount, form.taxRate, parsedLineItems],
  );

  const updateLineItem = (lineId: string, patch: Partial<InvoiceFormLine>) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((entry) => (entry.id === lineId ? { ...entry, ...patch } : entry)),
    }));
  };

  const selectInventoryItem = (lineId: string, inventoryItem: InventoryItem) => {
    updateLineItem(lineId, {
      inventoryItemId: inventoryItem.id,
      inventorySearch: inventoryItem.name,
      name: inventoryItem.name,
    });
  };

  if (!canEditFinance) {
    return <Navigate to={existingInvoice ? `/admin/finance/invoices/${existingInvoice.id}` : '/admin/finance/invoices'} replace />;
  }

  if (isEditing && !existingInvoice) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="Finance"
          title="Invoice not found"
          description="The invoice you tried to edit is missing or is no longer available."
          actions={<AdminLinkButton to="/admin/finance/invoices" tone="secondary"><ArrowLeft className="h-4 w-4" />Back to invoices</AdminLinkButton>}
        />
        <AdminEmptyState title="Missing invoice" body="Return to the invoice list and choose another record." />
      </AdminPage>
    );
  }

  const previewInvoiceNumber = form.invoiceNumber;
  const previewStatusLabel = getAccountingStatusLabel({
    id: existingInvoice?.id ?? 'preview',
    type: 'Invoice',
    title: `Invoice ${previewInvoiceNumber}`,
    clientName: form.clientName,
    clientPhone: form.clientPhone,
    clientEmail: form.clientEmail,
    amount: totals.total,
    status: form.status,
    dueDate: form.dueDate,
    issuedDate: existingInvoice?.issuedDate ?? new Date().toISOString(),
    invoiceNumber: form.invoiceNumber,
    invoiceDate: form.invoiceDate,
    lineItems: parsedLineItems,
    subtotal: totals.subtotal,
    taxRate: Number(form.taxRate || 0),
    taxAmount: totals.taxAmount,
    feeAmount: Number(form.feeAmount || 0),
  });

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Finance"
        title={isEditing ? `Edit ${form.invoiceNumber}` : 'Create invoice'}
        description="Use the dedicated invoice editor to capture client details, build line items, and calculate totals in real time before saving."
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminLinkButton to={isEditing && existingInvoice ? `/admin/finance/invoices/${existingInvoice.id}` : '/admin/finance/invoices'} tone="ghost"><ArrowLeft className="h-4 w-4" />Cancel</AdminLinkButton>
            <AdminButton
              type="submit"
              form="invoice-editor-form"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Save invoice'}
            </AdminButton>
          </div>
        }
      />

      <AdminSubnav items={financeNavItems(records)} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <form
          id="invoice-editor-form"
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitError('');
            const lineItems = parseFormLineItems(form.lineItems);
            if (!lineItems.length) {
              setSubmitError('Add at least one line item before saving the invoice.');
              return;
            }

            const nextTotals = calculateInvoiceTotals(lineItems, Number(form.taxRate || 0), Number(form.feeAmount || 0));
            const recordId = existingInvoice?.id ?? generateId('acct');
            const payload: AccountingRecord = {
              id: recordId,
              type: 'Invoice',
              title: `Invoice ${form.invoiceNumber}`,
              clientName: form.clientName.trim(),
              clientPhone: form.clientPhone.trim(),
              clientEmail: form.clientEmail.trim(),
              amount: nextTotals.total,
              status: form.status,
              dueDate: form.dueDate,
              issuedDate: existingInvoice?.issuedDate ?? new Date().toISOString(),
              invoiceNumber: form.invoiceNumber,
              invoiceDate: form.invoiceDate,
              lineItems,
              subtotal: nextTotals.subtotal,
              taxRate: Number(form.taxRate || 0),
              taxAmount: nextTotals.taxAmount,
              feeAmount: Number(form.feeAmount || 0),
            };

            setIsSaving(true);
            try {
              if (existingInvoice) {
                await updateAccountingRecord(existingInvoice.id, payload);
                navigate(`/admin/finance/invoices/${existingInvoice.id}`);
                return;
              }

              await addAccountingRecord(payload);
              navigate(`/admin/finance/invoices/${recordId}`);
            } catch (error) {
              console.error('Failed to save invoice:', error);
              setSubmitError('We could not save this invoice right now. Please try again.');
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {submitError ? (
            <div className="rounded-[1.1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#7d2f2f]">
              {submitError}
            </div>
          ) : null}
          <AdminSurface>
            <AdminSurfaceHeader title="Client & invoice info" description="Core contact details plus the auto-generated invoice identity." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name"><TextInput value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} required /></Field>
              <Field label="Client phone number"><TextInput value={form.clientPhone} onChange={(event) => setForm((current) => ({ ...current, clientPhone: event.target.value }))} /></Field>
              <Field label="Client email address"><TextInput type="email" value={form.clientEmail} onChange={(event) => setForm((current) => ({ ...current, clientEmail: event.target.value }))} /></Field>
              <Field label="Due date"><TextInput type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} required /></Field>
              <Field label="Invoice number"><TextInput value={form.invoiceNumber} readOnly /></Field>
              <Field label="Invoice date"><TextInput type="date" value={form.invoiceDate} readOnly /></Field>
              <Field label="Status">
                <SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AccountingRecord['status'] }))}>
                  <option value="Draft">Draft</option>
                  <option value="Issued">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </SelectInput>
              </Field>
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSurfaceHeader
              title="Line items"
              description="Add each product or service with quantity and unit price. Totals update automatically as you edit."
              action={
                <AdminButton
                  type="button"
                  tone="secondary"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      lineItems: [
                        ...current.lineItems,
                        {
                          ...createInvoiceLineItem(),
                          inventorySearch: '',
                          quantity: '1',
                          unitPrice: '0',
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add line item
                </AdminButton>
              }
            />

            <div className="space-y-4">
              {form.lineItems.map((item, index) => {
                const matchingInventory = sortedInventory.filter((inventoryItem) =>
                  `${inventoryItem.name} ${inventoryItem.category} ${inventoryItem.supplier}`
                    .toLowerCase()
                    .includes((item.inventorySearch || '').toLowerCase()),
                );
                const selectedInventory = item.inventoryItemId ? inventoryById.get(item.inventoryItemId) : undefined;
                const inventoryOptions = item.inventorySearch.trim() ? matchingInventory : sortedInventory.slice(0, 12);
                const availableQuantity = selectedInventory ? Math.max(0, selectedInventory.onHand - selectedInventory.reserved) : undefined;

                return (
                <div key={item.id} className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-tm-charcoal">Line item {index + 1}</p>
                    <AdminButton
                      type="button"
                      tone="ghost"
                      className="min-w-0 px-3"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          lineItems:
                            current.lineItems.length === 1
                              ? current.lineItems
                              : current.lineItems.filter((entry) => entry.id !== item.id),
                        }))
                      }
                      disabled={form.lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AdminButton>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field label="Search active inventory">
                      <TextInput
                        value={item.inventorySearch}
                        onChange={(event) =>
                          updateLineItem(item.id, {
                            inventorySearch: event.target.value,
                          })
                        }
                        placeholder="Search stock by name, category, or supplier"
                      />
                    </Field>
                    <Field label="Select inventory item">
                      <SelectInput
                        value={item.inventoryItemId ?? ''}
                        onChange={(event) => {
                          const selectedId = event.target.value;
                          if (!selectedId) {
                            updateLineItem(item.id, { inventoryItemId: undefined });
                            return;
                          }
                          const inventoryItem = inventoryById.get(selectedId);
                          if (!inventoryItem) return;
                          selectInventoryItem(item.id, inventoryItem);
                        }}
                      >
                        <option value="">Manual item / service</option>
                        {inventoryOptions.map((inventoryItem) => (
                          <option key={inventoryItem.id} value={inventoryItem.id}>
                            {inventoryItem.name} - {inventoryItem.category} - {Math.max(0, inventoryItem.onHand - inventoryItem.reserved)} {inventoryItem.unit} available
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>

                  {selectedInventory ? (
                    <div className="mt-4 rounded-[1rem] border border-[#dfc69d] bg-[#fbf6ed] px-4 py-3 text-sm text-tm-warm-gray">
                      Using inventory item <span className="font-semibold text-tm-charcoal">{selectedInventory.name}</span>.
                      {' '}Available now: <span className="font-semibold text-tm-charcoal">{availableQuantity} {selectedInventory.unit}</span>.
                      {' '}Supplier: <span className="font-semibold text-tm-charcoal">{selectedInventory.supplier}</span>.
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_140px_160px]">
                    <Field label="Item name">
                      <TextInput
                        value={item.name}
                        onChange={(event) =>
                          updateLineItem(item.id, {
                            name: event.target.value,
                            inventoryItemId: event.target.value === selectedInventory?.name ? item.inventoryItemId : undefined,
                          })
                        }
                        placeholder="Dining table, upholstery labour, delivery..."
                        required
                      />
                    </Field>
                    <Field label="Quantity"><TextInput type="number" min={1} step="1" value={item.quantity} onChange={(event) => updateLineItem(item.id, { quantity: event.target.value })} required /></Field>
                    <Field label="Unit price"><TextInput type="number" min={0} step="0.01" value={item.unitPrice} onChange={(event) => updateLineItem(item.id, { unitPrice: event.target.value })} required /></Field>
                  </div>
                </div>
              )})}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSurfaceHeader title="Taxes, fees & totals" description="Adjust tax percentage or additional fees while keeping the grand total live." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tax rate (%)"><TextInput type="number" min={0} step="0.01" value={form.taxRate} onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))} /></Field>
              <Field label="Additional fees"><TextInput type="number" min={0} step="0.01" value={form.feeAmount} onChange={(event) => setForm((current) => ({ ...current, feeAmount: event.target.value }))} /></Field>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoBlock label="Subtotal" value={formatCurrency(totals.subtotal)} />
              <InfoBlock label="Tax amount" value={formatCurrency(totals.taxAmount)} />
              <InfoBlock label="Grand total" value={formatCurrency(totals.total)} />
            </div>
          </AdminSurface>
        </form>

        <InvoicePaper
          companyName={companySettings.companyName || 'Tailored Manor'}
          companyAddress={companySettings.address}
          companyEmail={companySettings.email}
          companyPhone={companySettings.primaryPhone || companySettings.whatsappNumber}
          invoiceNumber={previewInvoiceNumber}
          invoiceDate={form.invoiceDate}
          dueDate={form.dueDate}
          clientName={form.clientName}
          clientPhone={form.clientPhone}
          clientEmail={form.clientEmail}
          lineItems={parsedLineItems}
          statusLabel={previewStatusLabel}
          subtotal={totals.subtotal}
          taxRate={Number(form.taxRate || 0)}
          taxAmount={totals.taxAmount}
          feeAmount={Number(form.feeAmount || 0)}
          total={totals.total}
        />
      </div>
    </AdminPage>
  );
}

function InvoicePaper({
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  invoiceNumber,
  invoiceDate,
  dueDate,
  clientName,
  clientPhone,
  clientEmail,
  lineItems,
  statusLabel,
  subtotal,
  taxRate,
  taxAmount,
  feeAmount,
  total,
}: {
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  lineItems: InvoiceLineItem[];
  statusLabel: AccountingStatusLabel;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  feeAmount: number;
  total: number;
}) {
  return (
    <AdminSurface className="overflow-visible bg-[#f7f1e8]">
      <div className="mx-auto max-w-[820px] rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_18px_60px_rgba(12,12,12,0.08)] sm:p-8">
        <div className="flex flex-col gap-5 border-b border-[#ece3d6] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-tm-gold">Invoice document</p>
            <h2 className="mt-3 font-cormorant text-[2.35rem] leading-none tracking-[-0.04em] text-tm-charcoal">{companyName}</h2>
            <div className="mt-4 space-y-1 text-sm leading-6 text-tm-warm-gray">
              {companyAddress ? <p>{companyAddress}</p> : null}
              {companyPhone ? <p>{companyPhone}</p> : null}
              {companyEmail ? <p>{companyEmail}</p> : null}
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-[#dfc69d] bg-[#fbf6ed] px-4 py-4 sm:min-w-[220px]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-tm-charcoal">Invoice</p>
              <AdminStatusChip label={formatStatusLabel(statusLabel)} tone={toneForFinance(statusLabel)} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-tm-warm-gray">
              <p><span className="font-semibold text-tm-charcoal">Number:</span> {invoiceNumber}</p>
              <p><span className="font-semibold text-tm-charcoal">Date:</span> {invoiceDate ? formatDate(invoiceDate) : 'Not set'}</p>
              <p><span className="font-semibold text-tm-charcoal">Due:</span> {dueDate ? formatDate(dueDate) : 'Not set'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Bill to</p>
            <div className="mt-3 space-y-1 text-sm leading-6 text-tm-warm-gray">
              <p className="font-semibold text-tm-charcoal">{clientName || 'Client not captured yet'}</p>
              {clientPhone ? <p>{clientPhone}</p> : null}
              {clientEmail ? <p>{clientEmail}</p> : null}
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] p-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Summary</p>
            <div className="mt-3 space-y-1 text-sm leading-6 text-tm-warm-gray">
              <p>{lineItems.length} line item{lineItems.length === 1 ? '' : 's'}</p>
              <p>Total due {formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[620px] overflow-hidden rounded-[1.35rem] border border-black/7">
            <div className="grid grid-cols-[minmax(0,1.4fr)_90px_140px_140px] gap-3 bg-[#f7f1e8] px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-tm-warm-gray">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Line total</span>
            </div>
            <div className="divide-y divide-black/6 bg-white">
              {lineItems.length ? (
                lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1.4fr)_90px_140px_140px] gap-3 px-4 py-4 text-sm text-tm-warm-gray">
                    <span className="font-medium text-tm-charcoal">{item.name}</span>
                    <span className="text-right">{item.quantity}</span>
                    <span className="text-right">{formatCurrency(item.unitPrice)}</span>
                    <span className="text-right font-medium text-tm-charcoal">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-sm text-tm-warm-gray">Add a line item to populate the invoice breakdown.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-[320px] rounded-[1.35rem] border border-black/7 bg-[#fbf7f1] p-4">
            <div className="space-y-3 text-sm text-tm-warm-gray">
              <div className="flex items-center justify-between gap-3"><span>Subtotal</span><span className="font-medium text-tm-charcoal">{formatCurrency(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Tax{taxRate ? ` (${taxRate}%)` : ''}</span><span className="font-medium text-tm-charcoal">{formatCurrency(taxAmount)}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Fees</span><span className="font-medium text-tm-charcoal">{formatCurrency(feeAmount)}</span></div>
            </div>
            <div className="mt-4 border-t border-black/8 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-tm-charcoal">Grand total</span>
                <span className="font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-charcoal">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-dashed border-black/10 bg-[#fcfaf7] px-4 py-4 text-sm leading-6 text-tm-warm-gray">
          Thank you for choosing {companyName}. Please use the invoice number <span className="font-semibold text-tm-charcoal">{invoiceNumber}</span> as your payment reference.
        </div>
      </div>
    </AdminSurface>
  );
}
