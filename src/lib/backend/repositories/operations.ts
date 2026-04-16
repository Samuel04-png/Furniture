import { doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type {
  AccountingRecord,
  InventoryItem,
  ProductionOrder,
  ProductionStage,
} from '../../../types';
import type { UserIdentity } from '../firestore';
import {
  createDocument,
  removeDocument,
  subscribeCollection,
  withUpdateAudit,
} from '../firestore';

export function subscribeProductionOrders(
  onData: (orders: ProductionOrder[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeCollection<ProductionOrder>(
    'productionJobs',
    [orderBy('deadline', 'asc')],
    onData,
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
  return subscribeCollection<InventoryItem>(
    'inventoryItems',
    [orderBy('name', 'asc')],
    onData,
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
  return subscribeCollection<AccountingRecord>(
    'accountingRecords',
    [orderBy('issuedDate', 'desc')],
    onData,
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
  await updateDoc(
    doc(db, 'productionJobs', orderId),
    withUpdateAudit<ProductionOrder>({ status }, user),
  );
}

export async function createProductionOrder(
  order: ProductionOrder,
  user?: UserIdentity | null,
) {
  await createDocument('productionJobs', order.id, order, user);
}

export async function updateProductionOrder(
  orderId: string,
  patch: Partial<ProductionOrder>,
  user?: UserIdentity | null,
) {
  await updateDoc(doc(db, 'productionJobs', orderId), withUpdateAudit(patch, user));
}

export async function deleteProductionOrder(orderId: string) {
  await removeDocument('productionJobs', orderId);
}

export async function createInventoryItem(
  item: InventoryItem,
  user?: UserIdentity | null,
) {
  await createDocument('inventoryItems', item.id, item, user);
}

export async function updateInventoryItem(
  inventoryId: string,
  patch: Partial<InventoryItem>,
  user?: UserIdentity | null,
) {
  await updateDoc(doc(db, 'inventoryItems', inventoryId), withUpdateAudit(patch, user));
}

export async function deleteInventoryItem(inventoryId: string) {
  await removeDocument('inventoryItems', inventoryId);
}

export async function createAccountingRecord(
  record: AccountingRecord,
  user?: UserIdentity | null,
) {
  await createDocument('accountingRecords', record.id, record, user);
}

export async function updateAccountingRecord(
  recordId: string,
  patch: Partial<AccountingRecord>,
  user?: UserIdentity | null,
) {
  await updateDoc(doc(db, 'accountingRecords', recordId), withUpdateAudit(patch, user));
}

export async function deleteAccountingRecord(recordId: string) {
  await removeDocument('accountingRecords', recordId);
}
