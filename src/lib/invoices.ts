import type { AccountingRecord, InvoiceLineItem } from '../types';

export type AccountingStatusLabel = AccountingRecord['status'] | 'Unpaid';

const invoiceNumberPattern = /^INV-(\d+)$/i;

export function createInvoiceLineItem(): InvoiceLineItem {
  return {
    id: `line-${Math.random().toString(36).slice(2, 10)}`,
    name: '',
    quantity: 1,
    unitPrice: 0,
  };
}

export function sortInvoiceRecords(records: AccountingRecord[]) {
  return [...records]
    .filter((record) => record.type === 'Invoice')
    .sort((left, right) => {
      const leftDate = new Date(left.invoiceDate || left.issuedDate || left.createdAt || 0).getTime();
      const rightDate = new Date(right.invoiceDate || right.issuedDate || right.createdAt || 0).getTime();
      return leftDate - rightDate;
    });
}

export function parseInvoiceNumber(value?: string) {
  if (!value) return undefined;
  const match = value.match(invoiceNumberPattern);
  if (!match) return undefined;
  return Number(match[1]);
}

export function formatInvoiceNumber(sequence: number) {
  return `INV-${String(sequence).padStart(4, '0')}`;
}

export function getResolvedInvoiceNumbers(records: AccountingRecord[]) {
  const invoices = sortInvoiceRecords(records);
  const assigned = new Map<string, string>();
  const used = new Set<number>();

  invoices.forEach((record) => {
    const parsed = parseInvoiceNumber(record.invoiceNumber);
    if (!parsed) return;
    used.add(parsed);
    assigned.set(record.id, formatInvoiceNumber(parsed));
  });

  let nextSequence = 1;

  invoices.forEach((record) => {
    if (assigned.has(record.id)) return;
    while (used.has(nextSequence)) nextSequence += 1;
    used.add(nextSequence);
    assigned.set(record.id, formatInvoiceNumber(nextSequence));
    nextSequence += 1;
  });

  return assigned;
}

export function getInvoiceNumber(record: AccountingRecord, records: AccountingRecord[]) {
  return record.invoiceNumber || getResolvedInvoiceNumbers(records).get(record.id) || formatInvoiceNumber(1);
}

export function getNextInvoiceNumber(records: AccountingRecord[]) {
  const resolved = [...getResolvedInvoiceNumbers(records).values()]
    .map((value) => parseInvoiceNumber(value) || 0);
  const highest = resolved.length ? Math.max(...resolved) : 0;
  return formatInvoiceNumber(highest + 1);
}

export function getInvoiceLineItems(record: AccountingRecord): InvoiceLineItem[] {
  if (record.lineItems?.length) {
    return record.lineItems;
  }

  if (record.amount > 0) {
    return [
      {
        id: `${record.id}-legacy`,
        name: record.title || 'Legacy invoice amount',
        quantity: 1,
        unitPrice: record.amount,
      },
    ];
  }

  return [];
}

export function calculateInvoiceSubtotal(lineItems: InvoiceLineItem[]) {
  return lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
}

export function calculateInvoiceTotals(lineItems: InvoiceLineItem[], taxRate = 0, feeAmount = 0) {
  const subtotal = calculateInvoiceSubtotal(lineItems);
  const safeTaxRate = Number.isFinite(taxRate) ? taxRate : 0;
  const safeFeeAmount = Number.isFinite(feeAmount) ? feeAmount : 0;
  const taxAmount = subtotal * (safeTaxRate / 100);
  const total = subtotal + taxAmount + safeFeeAmount;

  return {
    subtotal,
    taxRate: safeTaxRate,
    taxAmount,
    feeAmount: safeFeeAmount,
    total,
  };
}

export function getAccountingStatusLabel(record: AccountingRecord): AccountingStatusLabel {
  if (record.status === 'Paid') return 'Paid';
  if (record.status === 'Draft') return 'Draft';

  const dueAt = new Date(record.dueDate).getTime();
  if (!Number.isNaN(dueAt)) {
    const dueDate = new Date(record.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    if (Date.now() > dueDate.getTime()) {
      return 'Overdue';
    }
  }

  return 'Unpaid';
}

export function getInvoiceDate(record: AccountingRecord) {
  return record.invoiceDate || record.issuedDate;
}

