import type { CompanySettings, AccountingRecord } from '../types';
import {
  calculateInvoiceTotals,
  getAccountingStatusLabel,
  getInvoiceDate,
  getInvoiceLineItems,
  getInvoiceNumber,
} from './invoices';
import { formatCurrency, formatDate } from './utils';

type PdfFont = 'F1' | 'F2';

class SimplePdfBuilder {
  private readonly pageWidth = 595.28;
  private readonly pageHeight = 841.89;
  private readonly pages: string[] = [];

  addPage() {
    this.pages.push('');
    return this.pages.length - 1;
  }

  text(page: number, x: number, top: number, value: string, options?: { size?: number; font?: PdfFont; color?: [number, number, number] }) {
    const text = escapePdfText(value);
    const size = options?.size ?? 12;
    const font = options?.font ?? 'F1';
    const color = options?.color ?? [0.11, 0.09, 0.08];
    const y = this.pageHeight - top;
    this.append(page, `BT /${font} ${size.toFixed(2)} Tf ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${text}) Tj ET`);
  }

  line(page: number, x1: number, top1: number, x2: number, top2: number, options?: { width?: number; color?: [number, number, number] }) {
    const color = options?.color ?? [0.88, 0.83, 0.76];
    const width = options?.width ?? 1;
    const y1 = this.pageHeight - top1;
    const y2 = this.pageHeight - top2;
    this.append(page, `${width.toFixed(2)} w ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  rect(page: number, x: number, top: number, width: number, height: number, options?: { stroke?: [number, number, number]; fill?: [number, number, number] }) {
    const y = this.pageHeight - top - height;
    const stroke = options?.stroke;
    const fill = options?.fill;
    const commands: string[] = [];

    if (stroke) {
      commands.push(`${stroke[0].toFixed(3)} ${stroke[1].toFixed(3)} ${stroke[2].toFixed(3)} RG`);
    }
    if (fill) {
      commands.push(`${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg`);
    }

    commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);
    commands.push(fill && stroke ? 'B' : fill ? 'f' : 'S');
    this.append(page, commands.join(' '));
  }

  build() {
    const objectBodies = new Map<number, string>();
    let nextObjectId = 1;

    const catalogId = nextObjectId++;
    const pagesId = nextObjectId++;
    const regularFontId = nextObjectId++;
    const boldFontId = nextObjectId++;

    objectBodies.set(regularFontId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objectBodies.set(boldFontId, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    const pageIds: number[] = [];
    const contentIds: number[] = [];

    this.pages.forEach((content) => {
      const pageId = nextObjectId++;
      const contentId = nextObjectId++;
      pageIds.push(pageId);
      contentIds.push(contentId);
      objectBodies.set(
        pageId,
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.pageWidth.toFixed(2)} ${this.pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
      objectBodies.set(contentId, `<< /Length ${content.length} >>\nstream\n${content}endstream`);
    });

    objectBodies.set(pagesId, `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`);
    objectBodies.set(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    const lines: string[] = ['%PDF-1.4'];
    const offsets = new Map<number, number>();

    for (let objectId = 1; objectId < nextObjectId; objectId += 1) {
      offsets.set(objectId, lines.join('\n').length + 1);
      lines.push(`${objectId} 0 obj`);
      lines.push(objectBodies.get(objectId) ?? '<< >>');
      lines.push('endobj');
    }

    const xrefOffset = lines.join('\n').length + 1;
    lines.push('xref');
    lines.push(`0 ${nextObjectId}`);
    lines.push('0000000000 65535 f ');

    for (let objectId = 1; objectId < nextObjectId; objectId += 1) {
      lines.push(`${String(offsets.get(objectId) ?? 0).padStart(10, '0')} 00000 n `);
    }

    lines.push('trailer');
    lines.push(`<< /Size ${nextObjectId} /Root ${catalogId} 0 R >>`);
    lines.push('startxref');
    lines.push(String(xrefOffset));
    lines.push('%%EOF');

    return new Blob([lines.join('\n')], { type: 'application/pdf' });
  }

  private append(page: number, command: string) {
    this.pages[page] += `${command}\n`;
  }
}

function escapePdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function estimateTextWidth(text: string, size: number) {
  return text.length * size * 0.48;
}

function wrapText(text: string, maxWidth: number, size: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines: string[] = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const next = `${current} ${words[index]}`;
    if (estimateTextWidth(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    lines.push(current);
    current = words[index];
  }

  lines.push(current);
  return lines;
}

function drawLabelValuePair(builder: SimplePdfBuilder, page: number, label: string, value: string, x: number, top: number) {
  builder.text(page, x, top, label, { size: 9, font: 'F2', color: [0.44, 0.31, 0.14] });
  builder.text(page, x + 72, top, value, { size: 9 });
}

export function downloadInvoicePdf({
  invoice,
  records,
  companySettings,
}: {
  invoice: AccountingRecord;
  records: AccountingRecord[];
  companySettings: CompanySettings;
}) {
  const invoiceNumber = getInvoiceNumber(invoice, records);
  const lineItems = getInvoiceLineItems(invoice);
  const totals = calculateInvoiceTotals(lineItems, invoice.taxRate ?? 0, invoice.feeAmount ?? 0);
  const total = invoice.amount || totals.total;
  const statusLabel = getAccountingStatusLabel(invoice);
  const builder = new SimplePdfBuilder();
  let page = builder.addPage();
  let top = 54;

  const margin = 48;
  const contentWidth = 499;
  const tableStart = 258;
  const pageBottom = 760;

  const drawHeader = () => {
    builder.text(page, margin, 58, companySettings.companyName || 'Tailored Manor', { size: 24, font: 'F2' });
    builder.text(page, margin, 84, companySettings.address || 'Custom furniture studio', { size: 10, color: [0.49, 0.43, 0.38] });

    if (companySettings.primaryPhone || companySettings.whatsappNumber) {
      builder.text(page, margin, 100, companySettings.primaryPhone || companySettings.whatsappNumber, { size: 10, color: [0.49, 0.43, 0.38] });
    }
    if (companySettings.email) {
      builder.text(page, margin, 116, companySettings.email, { size: 10, color: [0.49, 0.43, 0.38] });
    }

    builder.text(page, 430, 58, 'INVOICE', { size: 13, font: 'F2', color: [0.44, 0.31, 0.14] });
    drawLabelValuePair(builder, page, 'Number', invoiceNumber, 350, 84);
    drawLabelValuePair(builder, page, 'Date', formatDate(getInvoiceDate(invoice) || invoice.issuedDate), 350, 100);
    drawLabelValuePair(builder, page, 'Due', formatDate(invoice.dueDate), 350, 116);
    drawLabelValuePair(builder, page, 'Status', statusLabel, 350, 132);
    builder.line(page, margin, 152, margin + contentWidth, 152);

    builder.rect(page, margin, 172, 235, 74, {
      stroke: [0.91, 0.87, 0.81],
      fill: [0.984, 0.976, 0.965],
    });
    builder.text(page, margin + 14, 192, 'Bill To', { size: 9, font: 'F2', color: [0.44, 0.31, 0.14] });
    builder.text(page, margin + 14, 212, invoice.clientName || 'Client not captured', { size: 11, font: 'F2' });
    if (invoice.clientPhone) builder.text(page, margin + 14, 228, invoice.clientPhone, { size: 10, color: [0.49, 0.43, 0.38] });
    if (invoice.clientEmail) builder.text(page, margin + 14, invoice.clientPhone ? 244 : 228, invoice.clientEmail, { size: 10, color: [0.49, 0.43, 0.38] });

    builder.rect(page, margin, tableStart, contentWidth, 24, {
      stroke: [0.91, 0.87, 0.81],
      fill: [0.968, 0.945, 0.910],
    });
    builder.text(page, margin + 14, tableStart + 15, 'ITEM', { size: 8.5, font: 'F2', color: [0.44, 0.31, 0.14] });
    builder.text(page, 346, tableStart + 15, 'QTY', { size: 8.5, font: 'F2', color: [0.44, 0.31, 0.14] });
    builder.text(page, 404, tableStart + 15, 'UNIT PRICE', { size: 8.5, font: 'F2', color: [0.44, 0.31, 0.14] });
    builder.text(page, 486, tableStart + 15, 'TOTAL', { size: 8.5, font: 'F2', color: [0.44, 0.31, 0.14] });
    top = tableStart + 24;
  };

  const newPage = () => {
    page = builder.addPage();
    top = 54;
    drawHeader();
  };

  drawHeader();

  lineItems.forEach((item) => {
    const nameLines = wrapText(item.name, 240, 10);
    const rowHeight = Math.max(28, nameLines.length * 13 + 12);

    if (top + rowHeight > pageBottom) {
      newPage();
    }

    builder.line(page, margin, top, margin + contentWidth, top, { color: [0.93, 0.90, 0.86], width: 0.8 });
    nameLines.forEach((line, index) => {
      builder.text(page, margin + 14, top + 16 + index * 12, line, { size: 10 });
    });
    builder.text(page, 350, top + 16, String(item.quantity), { size: 10 });
    builder.text(page, 404, top + 16, formatCurrency(item.unitPrice), { size: 10 });
    builder.text(page, 486, top + 16, formatCurrency(item.quantity * item.unitPrice), { size: 10, font: 'F2' });
    top += rowHeight;
  });

  builder.line(page, margin, top, margin + contentWidth, top, { color: [0.91, 0.87, 0.81] });
  top += 24;

  if (top + 140 > pageBottom) {
    newPage();
  }

  builder.rect(page, 336, top, 211, 104, {
    stroke: [0.91, 0.87, 0.81],
    fill: [0.984, 0.976, 0.965],
  });
  drawLabelValuePair(builder, page, 'Subtotal', formatCurrency(invoice.subtotal ?? totals.subtotal), 352, top + 22);
  drawLabelValuePair(builder, page, 'Tax', formatCurrency(invoice.taxAmount ?? totals.taxAmount), 352, top + 40);
  drawLabelValuePair(builder, page, 'Fees', formatCurrency(invoice.feeAmount ?? totals.feeAmount), 352, top + 58);
  builder.line(page, 352, top + 74, 530, top + 74, { color: [0.85, 0.79, 0.71] });
  builder.text(page, 352, top + 92, 'Grand Total', { size: 10, font: 'F2', color: [0.11, 0.09, 0.08] });
  builder.text(page, 455, top + 92, formatCurrency(total), { size: 16, font: 'F2' });

  builder.text(page, margin, 778, `Thank you for choosing ${companySettings.companyName || 'Tailored Manor'}. Please reference ${invoiceNumber} when making payment.`, {
    size: 9,
    color: [0.49, 0.43, 0.38],
  });

  const blob = builder.build();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
