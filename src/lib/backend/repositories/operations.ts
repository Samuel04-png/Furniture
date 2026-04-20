import type {
  AccountingRecord,
  AccountingStatus,
  AccountingType,
  InventoryItem,
  ProductionOrder,
  ProductionStage,
} from '../../../types';
import type { UserIdentity } from '../firestore';
import {
  createDocument,
  removeDocument,
  subscribeMergedCollections,
  upsertDocument,
} from '../firestore';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function normalizeProductionStage(value: unknown): ProductionStage {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'released') return 'Confirmed Order';
  if (normalized === 'materials-sourced' || normalized === 'materials sourced') {
    return 'Materials Sourced';
  }
  if (normalized === 'materials-ready' || normalized === 'materials ready') {
    return 'Materials Sourced';
  }
  if (normalized === 'in-production' || normalized === 'in production') {
    return 'In Production';
  }
  if (
    normalized === 'cutting' ||
    normalized === 'joinery' ||
    normalized === 'assembly' ||
    normalized === 'upholstery' ||
    normalized === 'upholstering' ||
    normalized === 'finishing'
  ) {
    return 'In Production';
  }
  if (normalized === 'qc-queue' || normalized === 'quality check') {
    return 'Quality Check';
  }
  if (normalized === 'ready' || normalized === 'ready for install') {
    return 'Ready for Delivery';
  }
  if (normalized === 'ready-for-delivery' || normalized === 'ready for delivery') {
    return 'Ready for Delivery';
  }
  if (normalized === 'delivered') {
    return 'Delivered';
  }
  return (value as ProductionStage) || 'Confirmed Order';
}

function toJobStatus(status: ProductionStage) {
  if (status === 'Materials Sourced') return 'materials-sourced';
  if (status === 'In Production') return 'in-production';
  if (status === 'Quality Check') return 'qc-queue';
  if (status === 'Ready for Delivery') return 'ready-for-delivery';
  if (status === 'Delivered') return 'delivered';
  return 'released';
}

function normalizeProductionOrderRecord(
  orderId: string,
  raw: Partial<ProductionOrder> & Record<string, unknown>,
): ProductionOrder {
  const productName = asString(
    raw.productName ?? raw.pieceName ?? raw.title,
    asString(raw.title, 'Production job'),
  );
  const deadline = asString(raw.deliveryDate ?? raw.dueDate ?? raw.deadline);
  const notes = asString(raw.notes);
  return {
    id: orderId,
    title: asString(raw.title ?? raw.pieceName) || undefined,
    consultationId: asString(raw.consultationId) || undefined,
    clientName: asString(raw.clientName),
    productId: asString(raw.productId ?? raw.orderId),
    productName,
    configuration: asString(raw.configuration, notes),
    material: asString(raw.material),
    deadline,
    deliveryDate: deadline || undefined,
    craftsman: asString(raw.craftsman),
    status: normalizeProductionStage(raw.status),
    depositPaid: asNumber(raw.depositPaid),
    balanceDue: asNumber(raw.balanceDue),
    dependencies: asStringArray(raw.dependencies),
    qcNotes: asString(raw.qcNotes, notes) || undefined,
    progressPhotos: asStringArray(raw.progressPhotos),
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

function normalizeInventoryCategory(value: unknown): InventoryItem['category'] {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'fabric') return 'Fabric';
  if (normalized === 'hardware') return 'Hardware';
  if (normalized === 'finishing') return 'Finishing';
  return 'Hardwood';
}

function normalizeInventoryRecord(
  itemId: string,
  raw: Partial<InventoryItem> & Record<string, unknown>,
): InventoryItem | undefined {
  const unit = asString(raw.unit);
  const quantity =
    typeof raw.onHand === 'number'
      ? raw.onHand
      : typeof raw.quantity === 'number'
        ? raw.quantity
        : undefined;
  const reorderPoint =
    typeof raw.reorderPoint === 'number' ? raw.reorderPoint : undefined;
  const supplier = asString(raw.supplier);
  const hasInventoryFields =
    Boolean(unit) ||
    quantity !== undefined ||
    reorderPoint !== undefined ||
    Boolean(supplier) ||
    typeof raw.costPerUnit === 'number';

  if (!hasInventoryFields) {
    return undefined;
  }

  return {
    id: itemId,
    name: asString(raw.name, 'Untitled stock item'),
    category: normalizeInventoryCategory(raw.category ?? raw.type),
    unit: unit || 'units',
    onHand: quantity ?? 0,
    reserved: asNumber(raw.reserved),
    reorderPoint: reorderPoint ?? 0,
    supplier,
    costPerUnit:
      typeof raw.costPerUnit === 'number' ? raw.costPerUnit : undefined,
    eta: asString(raw.eta),
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

function normalizeAccountingStatus(value: unknown): AccountingStatus {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'draft') return 'Draft';
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'overdue') return 'Overdue';
  if (normalized === 'unpaid' || normalized === 'issued' || normalized === 'sent') {
    return 'Issued';
  }
  return (value as AccountingStatus) || 'Draft';
}

function normalizeAccountingType(
  value: unknown,
  fallback: AccountingType,
): AccountingType {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'invoice') return 'Invoice';
  if (normalized === 'deposit') return 'Deposit';
  if (normalized === 'expense') return 'Expense';
  if (normalized === 'purchase order' || normalized === 'purchaseorder' || normalized === 'purchase-order') {
    return 'Purchase Order';
  }
  return fallback;
}

function normalizeAccountingRecord(
  recordId: string,
  raw: Partial<AccountingRecord> & Record<string, unknown>,
  fallbackType: AccountingType,
): AccountingRecord {
  const amount =
    typeof raw.amount === 'number'
      ? raw.amount
      : typeof raw.total === 'number'
        ? raw.total
        : 0;

  return {
    id: recordId,
    type: normalizeAccountingType(raw.type, fallbackType),
    title: asString(raw.title, asString(raw.clientName ?? raw.name ?? raw.productName, 'Finance record')),
    clientName: asString(raw.clientName ?? raw.name) || undefined,
    clientPhone: asString(raw.clientPhone) || undefined,
    clientEmail: asString(raw.clientEmail) || undefined,
    amount,
    status: normalizeAccountingStatus(raw.status),
    dueDate: asString(raw.dueDate ?? raw.validUntil ?? raw.deliveryDate),
    issuedDate: asString(raw.issuedDate ?? raw.invoiceDate ?? raw.createdAt ?? raw.updatedAt),
    invoiceNumber: asString(raw.invoiceNumber) || undefined,
    invoiceDate: asString(raw.invoiceDate ?? raw.createdAt) || undefined,
    lineItems: Array.isArray(raw.lineItems)
      ? raw.lineItems
      : Array.isArray(raw.items)
        ? (raw.items as AccountingRecord['lineItems'])
        : undefined,
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : undefined,
    taxRate: typeof raw.taxRate === 'number' ? raw.taxRate : undefined,
    taxAmount: typeof raw.taxAmount === 'number' ? raw.taxAmount : undefined,
    feeAmount: typeof raw.feeAmount === 'number' ? raw.feeAmount : undefined,
    attachmentUrl: asString(raw.attachmentUrl) || undefined,
    attachmentPath: asString(raw.attachmentPath) || undefined,
    createdAt: asString(raw.createdAt) || undefined,
    updatedAt: asString(raw.updatedAt) || undefined,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}

function financeCollectionPath(type: AccountingType) {
  return 'accountingRecords';
}

function sortByUpdatedThenName<T extends { updatedAt?: string; name?: string; title?: string }>({
  left,
  right,
}: {
  left: T;
  right: T;
}) {
  const leftUpdated = left.updatedAt ? Date.parse(left.updatedAt) : 0;
  const rightUpdated = right.updatedAt ? Date.parse(right.updatedAt) : 0;
  if (rightUpdated !== leftUpdated) {
    return rightUpdated - leftUpdated;
  }
  return (left.name ?? left.title ?? '').localeCompare(right.name ?? right.title ?? '');
}

export function subscribeProductionOrders(
  onData: (orders: ProductionOrder[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedCollections<ProductionOrder>(
    [
      {
        key: 'productions',
        path: 'productions',
        priority: 1,
        map: (order) => normalizeProductionOrderRecord(order.id, order),
      },
    ],
    (orders) =>
      onData(
        orders.sort((left, right) => {
          const leftDate = left.deliveryDate || left.deadline;
          const rightDate = right.deliveryDate || right.deadline;
          return Date.parse(leftDate || '') - Date.parse(rightDate || '');
        }),
      ),
    (error) => {
      console.error('Failed to subscribe to production jobs:', error);
      onError?.('Unable to load production jobs right now.');
    },
  );
}

export function subscribeInventoryItems(
  onData: (items: InventoryItem[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedCollections<InventoryItem>(
    [
      {
        key: 'inventoryItems',
        path: 'inventoryItems',
        priority: 1,
        map: (item) => normalizeInventoryRecord(item.id, item),
      },
    ],
    (items) =>
      onData(items.sort((left, right) => sortByUpdatedThenName({ left, right }))),
    (error) => {
      console.error('Failed to subscribe to inventory items:', error);
      onError?.('Unable to load inventory items right now.');
    },
  );
}

export function subscribeAccountingRecords(
  onData: (records: AccountingRecord[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeMergedCollections<AccountingRecord>(
    [
      {
        key: 'accountingRecords',
        path: 'accountingRecords',
        priority: 1,
        map: (record) =>
          normalizeAccountingRecord(
            record.id,
            record,
            normalizeAccountingType(record.type, 'Expense'),
          ),
      },
    ],
    (records) =>
      onData(
        records.sort((left, right) => {
          const leftDate = left.issuedDate || left.createdAt || '';
          const rightDate = right.issuedDate || right.createdAt || '';
          return Date.parse(rightDate) - Date.parse(leftDate);
        }),
      ),
    (error) => {
      console.error('Failed to subscribe to accounting records:', error);
      onError?.('Unable to load accounting records right now.');
    },
  );
}

export async function moveProductionOrder(
  orderId: string,
  status: ProductionStage,
  user?: UserIdentity | null,
) {
  await upsertDocument<ProductionOrder>(
    'productions',
    orderId,
    {
      status,
      deliveryDate: undefined,
    },
    user,
  );
}

export async function createProductionOrder(
  order: ProductionOrder,
  user?: UserIdentity | null,
) {
  await createDocument(
    'productions',
    order.id,
    {
      id: order.id,
      title: order.title || order.productName,
      productId: order.productId,
      clientName: order.clientName,
      status: order.status,
      depositPaid: order.depositPaid,
      dependencies: order.dependencies ?? [],
      qcNotes: order.qcNotes ?? '',
      deliveryDate: order.deliveryDate || order.deadline,
      deadline: order.deadline,
      productName: order.productName,
      configuration: order.configuration,
      material: order.material,
      craftsman: order.craftsman,
      balanceDue: order.balanceDue,
      progressPhotos: order.progressPhotos,
    },
    user,
  );
}

export async function updateProductionOrder(
  orderId: string,
  patch: Partial<ProductionOrder>,
  user?: UserIdentity | null,
) {
  await upsertDocument<ProductionOrder>(
    'productions',
    orderId,
    {
      ...patch,
      title: patch.title ?? patch.productName,
      status: patch.status,
      deliveryDate: patch.deliveryDate ?? patch.deadline,
    },
    user,
  );
}

export async function deleteProductionOrder(orderId: string) {
  await removeDocument('productions', orderId);
}

export async function createInventoryItem(
  item: InventoryItem,
  user?: UserIdentity | null,
) {
  await createDocument(
    'inventoryItems',
    item.id,
    {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      onHand: item.onHand,
      reorderPoint: item.reorderPoint,
      supplier: item.supplier,
      costPerUnit: item.costPerUnit ?? 0,
      reserved: item.reserved,
      eta: item.eta,
      publishedToWebsite: false,
      visibleOnSite: false,
    },
    user,
  );
}

export async function updateInventoryItem(
  inventoryId: string,
  patch: Partial<InventoryItem>,
  user?: UserIdentity | null,
) {
  await upsertDocument<InventoryItem>(
    'inventoryItems',
    inventoryId,
    {
      name: patch.name,
      category: patch.category,
      unit: patch.unit,
      onHand: patch.onHand,
      reorderPoint: patch.reorderPoint,
      supplier: patch.supplier,
      costPerUnit: patch.costPerUnit,
      reserved: patch.reserved,
      eta: patch.eta,
    } as Partial<InventoryItem>,
    user,
  );
}

export async function deleteInventoryItem(inventoryId: string) {
  await removeDocument('inventoryItems', inventoryId);
}

export async function createAccountingRecord(
  record: AccountingRecord,
  user?: UserIdentity | null,
) {
  await createDocument(financeCollectionPath(record.type), record.id, record, user);
}

export async function updateAccountingRecord(
  recordId: string,
  patch: Partial<AccountingRecord>,
  user?: UserIdentity | null,
) {
  const path = financeCollectionPath(patch.type ?? 'Expense');
  await upsertDocument<AccountingRecord>(path, recordId, patch, user);
}

export async function deleteAccountingRecord(recordId: string, type: AccountingType = 'Expense') {
  await removeDocument(financeCollectionPath(type), recordId);
}
