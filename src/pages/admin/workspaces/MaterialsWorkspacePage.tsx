import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  AdminButton,
  AdminDrawer,
  AdminEmptyState,
  AdminListRow,
  AdminModal,
  AdminPage,
  AdminPageHeader,
  AdminStatusChip,
  AdminSubnav,
  AdminSurface,
  AdminSurfaceHeader,
} from '../../../components/admin/AdminUi';
import { PublicShareTools } from '../../../components/admin/PublicShareTools';
import { canPerform } from '../../../lib/adminAccess';
import { getAccountingStatusLabel } from '../../../lib/invoices';
import { uploadWebsiteMedia } from '../../../lib/backend/services/storage';
import { formatCurrency, formatDate, generateId, slugify } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { AccountingRecord, InventoryItem, Material } from '../../../types';
import {
  Field,
  InfoBlock,
  materialsTabs,
  SearchField,
  SelectInput,
  TextArea,
  TextInput,
  useActiveAdmin,
} from './shared';

const createDefaultItemForm = () => ({
  name: '',
  category: 'Hardwood' as InventoryItem['category'],
  unit: 'm3',
  onHand: '0',
  reserved: '0',
  reorderPoint: '0',
  supplier: '',
  costPerUnit: '0',
  eta: '',
});

const createDefaultPoForm = () => ({
  title: '',
  clientName: '',
  amount: '',
  dueDate: '',
  status: 'Issued' as AccountingRecord['status'],
});

const createDefaultLibraryForm = () => ({
  name: '',
  origin: '',
  description: '',
  character: '',
  bestFor: '',
  grainImage: '',
  tone: '#8c6643',
  accentTone: '#b58a57',
  availableFinishes: '',
  sortOrder: '100',
  visibleOnSite: 'true',
});

function parseList(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function serializeList(items: string[]) {
  return items.join(', ');
}

function createMaterialId(name: string, existingIds: string[]) {
  const base = slugify(name) || 'material';
  let candidate = base;
  let suffix = 2;

  while (existingIds.includes(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function MaterialsWorkspacePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = materialsTabs.includes(params.tab as (typeof materialsTabs)[number])
    ? (params.tab as (typeof materialsTabs)[number])
    : 'stock';
  const activeMember = useActiveAdmin();
  const inventoryItems = useTailoredStore((state) => state.inventoryItems);
  const accountingRecords = useTailoredStore((state) => state.accountingRecords);
  const adminMaterials = useTailoredStore((state) => state.adminMaterials);
  const addInventoryItem = useTailoredStore((state) => state.addInventoryItem);
  const updateInventoryItem = useTailoredStore((state) => state.updateInventoryItem);
  const deleteInventoryItem = useTailoredStore((state) => state.deleteInventoryItem);
  const addAccountingRecord = useTailoredStore((state) => state.addAccountingRecord);
  const updateAccountingRecord = useTailoredStore((state) => state.updateAccountingRecord);
  const deleteAccountingRecord = useTailoredStore((state) => state.deleteAccountingRecord);
  const addMaterial = useTailoredStore((state) => state.addMaterial);
  const updateMaterial = useTailoredStore((state) => state.updateMaterial);
  const deleteMaterial = useTailoredStore((state) => state.deleteMaterial);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(inventoryItems[0]?.id);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(adminMaterials[0]?.id);
  const [search, setSearch] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ mode: 'receive', quantity: 1, reserve: 0 });
  const [itemForm, setItemForm] = useState(createDefaultItemForm());
  const [poForm, setPoForm] = useState(createDefaultPoForm());
  const [libraryForm, setLibraryForm] = useState(createDefaultLibraryForm());
  const [grainFile, setGrainFile] = useState<File | null>(null);
  const [pageError, setPageError] = useState('');
  const [stockError, setStockError] = useState('');
  const [itemModalError, setItemModalError] = useState('');
  const [poModalError, setPoModalError] = useState('');
  const [libraryModalError, setLibraryModalError] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingPo, setIsSavingPo] = useState(false);
  const [isSavingLibrary, setIsSavingLibrary] = useState(false);
  const [isPublishingStockItem, setIsPublishingStockItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isDeletingPo, setIsDeletingPo] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const canAdjustStock = canPerform('inventory.adjust', activeMember?.role);
  const canManageProcurement = canPerform('procurement.manage', activeMember?.role);
  const canDeleteRecords = canPerform('system.manage', activeMember?.role);

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0];
  const purchaseOrders = accountingRecords.filter((record) => record.type === 'Purchase Order');
  const websiteMaterials = useMemo(
    () => adminMaterials.filter((material) => material.publishedToWebsite === true),
    [adminMaterials],
  );
  const filteredMaterials = useMemo(
    () =>
      websiteMaterials.filter((material) =>
        `${material.name} ${material.origin} ${material.bestFor.join(' ')} ${material.availableFinishes.join(' ')}`
          .toLowerCase()
          .includes(librarySearch.toLowerCase()),
      ),
    [librarySearch, websiteMaterials],
  );
  const selectedMaterial =
    filteredMaterials.find((material) => material.id === selectedLibraryId) ?? filteredMaterials[0];
  const selectedItemWebsiteMaterial = selectedItem
    ? adminMaterials.find((material) => material.id === selectedItem.id)
    : undefined;
  const isSelectedItemPublished = selectedItemWebsiteMaterial?.publishedToWebsite === true;

  useEffect(() => {
    if (!filteredItems.length) {
      if (selectedItemId) setSelectedItemId(undefined);
      return;
    }
    if (!filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    if (!filteredMaterials.length) {
      if (selectedLibraryId) setSelectedLibraryId(undefined);
      return;
    }
    if (!filteredMaterials.some((material) => material.id === selectedLibraryId)) {
      setSelectedLibraryId(filteredMaterials[0].id);
    }
  }, [filteredMaterials, selectedLibraryId]);

  const clearAction = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };

  const resetItemForm = () => setItemForm(createDefaultItemForm());
  const resetPoForm = () => setPoForm(createDefaultPoForm());
  const resetLibraryForm = () => {
    setLibraryForm(createDefaultLibraryForm());
    setGrainFile(null);
  };

  const closeStockDrawer = () => {
    setStockDrawerOpen(false);
    setStockError('');
    setStockForm({ mode: 'receive', quantity: 1, reserve: 0 });
    clearAction();
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setEditingItemId(null);
    setItemModalError('');
    resetItemForm();
    clearAction();
  };

  const closePoModal = () => {
    setPoModalOpen(false);
    setEditingPoId(null);
    setPoModalError('');
    resetPoForm();
    clearAction();
  };

  const closeLibraryModal = () => {
    setLibraryModalOpen(false);
    setEditingMaterialId(null);
    setLibraryModalError('');
    resetLibraryForm();
  };

  const openCreateItemModal = () => {
    setEditingItemId(null);
    setItemModalError('');
    resetItemForm();
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      onHand: String(item.onHand),
      reserved: String(item.reserved),
      reorderPoint: String(item.reorderPoint),
      supplier: item.supplier,
      costPerUnit: String(item.costPerUnit ?? 0),
      eta: item.eta,
    });
    setItemModalError('');
    setItemModalOpen(true);
  };

  const openCreatePoModal = () => {
    setEditingPoId(null);
    setPoModalError('');
    resetPoForm();
    setPoModalOpen(true);
  };

  const openEditPoModal = (record: AccountingRecord) => {
    setEditingPoId(record.id);
    setPoForm({
      title: record.title,
      clientName: record.clientName ?? '',
      amount: String(record.amount),
      dueDate: record.dueDate,
      status: record.status,
    });
    setPoModalError('');
    setPoModalOpen(true);
  };

  const openCreateMaterialModal = () => {
    setEditingMaterialId(null);
    setLibraryModalError('');
    resetLibraryForm();
    setLibraryModalOpen(true);
  };

  const openEditMaterialModal = (material: Material) => {
    setEditingMaterialId(material.id);
    setLibraryForm({
      name: material.name,
      origin: material.origin,
      description: material.description,
      character: material.character,
      bestFor: serializeList(material.bestFor),
      grainImage: material.grainImage,
      tone: material.tone,
      accentTone: material.accentTone,
      availableFinishes: serializeList(material.availableFinishes),
      sortOrder: String(material.sortOrder ?? 100),
      visibleOnSite:
        material.publishedToWebsite === true || material.visibleOnSite !== false ? 'true' : 'false',
    });
    setGrainFile(null);
    setLibraryModalError('');
    setLibraryModalOpen(true);
  };

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'receive-stock') setStockDrawerOpen(true);
    if (action === 'create-po') openCreatePoModal();
  }, [searchParams]);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Materials"
        title="Stock control, procurement timing, and website material storytelling in one place."
        description="Operations still own stock and supplier flow here, and now the public material library can be added, edited, hidden, or deleted from the same workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            {canAdjustStock ? <AdminButton onClick={openCreateItemModal}>Add stock item</AdminButton> : null}
            {canAdjustStock ? <AdminButton tone="secondary" onClick={() => setStockDrawerOpen(true)}>Adjust stock</AdminButton> : null}
            {canManageProcurement ? <AdminButton tone="ghost" onClick={openCreatePoModal}>Add purchase order</AdminButton> : null}
          </div>
        }
      />

      <AdminSubnav
        items={[
          { label: 'Stock', href: '/admin/materials/stock', active: tab === 'stock', count: inventoryItems.length },
          { label: 'Purchase Orders', href: '/admin/materials/purchase-orders', active: tab === 'purchase-orders', count: purchaseOrders.length },
          { label: 'Website Library', href: '/admin/materials/library', active: tab === 'library', count: websiteMaterials.length },
        ]}
      />
      {pageError ? <div className="rounded-[1.2rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{pageError}</div> : null}

      {tab === 'stock' ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <AdminSurface className="space-y-4">
            <AdminSurfaceHeader
              title="Inventory items"
              description="Search, inspect, and manage stock items from one clean operational view."
              action={canAdjustStock ? <AdminButton tone="secondary" onClick={openCreateItemModal}>Add stock item</AdminButton> : null}
            />
            <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search material, hardware, or supplier" />
            <div className="space-y-3">
              {filteredItems.length ? filteredItems.map((item) => (
                <AdminListRow
                  key={item.id}
                  title={item.name}
                  subtitle={`${item.onHand} ${item.unit} on hand - ${item.supplier}`}
                  meta={item.category}
                  active={selectedItem?.id === item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  status={<AdminStatusChip label={item.onHand <= item.reorderPoint ? 'Low' : 'Healthy'} tone={item.onHand <= item.reorderPoint ? 'warning' : 'success'} />}
                />
              )) : <AdminEmptyState title="No stock items yet" body="Add the first stock item so quantity adjustments and procurement can start from real data." action={canAdjustStock ? <AdminButton onClick={openCreateItemModal}>Add stock item</AdminButton> : undefined} />}
            </div>
          </AdminSurface>

          <AdminSurface>
            {selectedItem ? (
              <>
                <AdminSurfaceHeader
                  title={selectedItem.name}
                  description={`${selectedItem.category} - supplier ${selectedItem.supplier}`}
                  action={canAdjustStock ? (
                    <div className="flex flex-wrap gap-2">
                      <AdminButton tone="secondary" onClick={() => { setStockError(''); setStockDrawerOpen(true); }}>Adjust stock</AdminButton>
                      <AdminButton tone="ghost" onClick={() => openEditItemModal(selectedItem)}>Edit item</AdminButton>
                      <AdminButton tone={isSelectedItemPublished ? 'ghost' : 'secondary'} disabled={isPublishingStockItem} onClick={async () => { setPageError(''); setIsPublishingStockItem(true); try { const nextPublishedState = !isSelectedItemPublished; await updateMaterial(selectedItem.id, { name: selectedItem.name, type: selectedItem.category, unit: selectedItem.unit, quantity: selectedItem.onHand, reorderPoint: selectedItem.reorderPoint, supplier: selectedItem.supplier, costPerUnit: selectedItem.costPerUnit ?? 0, publishedToWebsite: nextPublishedState, visibleOnSite: nextPublishedState }); if (nextPublishedState) { setSelectedLibraryId(selectedItem.id); } } catch (error) { console.error('Failed to update stock item website visibility:', error); setPageError('We could not update website publishing for this stock item right now.'); } finally { setIsPublishingStockItem(false); } }}>{isPublishingStockItem ? 'Saving...' : isSelectedItemPublished ? 'Hide from website' : 'Publish to website'}</AdminButton>
                      {canDeleteRecords ? <AdminButton tone="danger" disabled={isDeletingItem} onClick={async () => { if (!window.confirm(`Delete ${selectedItem.name}? This cannot be undone.`)) return; setPageError(''); setIsDeletingItem(true); try { await deleteInventoryItem(selectedItem.id); } catch (error) { console.error('Failed to delete stock item:', error); setPageError('We could not delete this stock item right now.'); } finally { setIsDeletingItem(false); } }}>{isDeletingItem ? 'Deleting...' : 'Delete item'}</AdminButton> : null}
                    </div>
                  ) : null}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoBlock label="On hand" value={`${selectedItem.onHand} ${selectedItem.unit}`} />
                  <InfoBlock label="Reserved" value={String(selectedItem.reserved)} />
                  <InfoBlock label="Reorder point" value={String(selectedItem.reorderPoint)} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoBlock label="Website status" value={isSelectedItemPublished ? 'Published to the public materials page' : 'Internal only'} />
                  <InfoBlock label="ETA" value={selectedItem.eta || 'Not captured'} />
                  <InfoBlock label="Suggested action" value={selectedItem.onHand <= selectedItem.reorderPoint ? 'Create a purchase order and notify operations' : 'Monitor consumption trend'} />
                  <InfoBlock label="Cost per unit" value={formatCurrency(selectedItem.costPerUnit ?? 0)} />
                </div>
                <div className="mt-6 rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-tm-warm-gray">Reservation logic</p>
                  <p className="mt-3 text-sm leading-6 text-tm-warm-gray">Reserve stock against active jobs before workshop release. If incoming material could miss a due date, escalate to procurement and the jobs workspace on the same day.</p>
                </div>
              </>
            ) : <AdminEmptyState title="No stock item selected" body="Choose a stock item to inspect quantity, reservations, and reorder readiness." />}
          </AdminSurface>
        </div>
      ) : null}

      {tab === 'purchase-orders' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <AdminSurface>
            <AdminSurfaceHeader title="Purchase orders" description="POs stay visible to operations and finance because supplier timing is a business risk, not only an inventory problem." action={canManageProcurement ? <AdminButton onClick={openCreatePoModal}>Add purchase order</AdminButton> : null} />
            <div className="space-y-3">
              {purchaseOrders.length ? purchaseOrders.map((record) => (
                <div key={record.id} className="rounded-[1.25rem] border border-black/7 bg-[#fbf7f1] px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-tm-charcoal">{record.title}</p>
                      <p className="mt-1 text-sm text-tm-warm-gray">{record.clientName || 'Supplier PO'} - {formatCurrency(record.amount)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <AdminStatusChip label={getAccountingStatusLabel(record)} tone={getAccountingStatusLabel(record) === 'Paid' ? 'success' : getAccountingStatusLabel(record) === 'Overdue' ? 'danger' : 'warning'} />
                      <span className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Due {formatDate(record.dueDate)}</span>
                    </div>
                  </div>
                  {canManageProcurement ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <AdminButton tone="ghost" onClick={() => openEditPoModal(record)}>Edit PO</AdminButton>
                      {canDeleteRecords ? <AdminButton tone="danger" disabled={isDeletingPo} onClick={async () => { if (!window.confirm(`Delete ${record.title}? This cannot be undone.`)) return; setPageError(''); setIsDeletingPo(true); try { await deleteAccountingRecord(record.id); } catch (error) { console.error('Failed to delete purchase order:', error); setPageError('We could not delete this purchase order right now.'); } finally { setIsDeletingPo(false); } }}>{isDeletingPo ? 'Deleting...' : 'Delete PO'}</AdminButton> : null}
                    </div>
                  ) : null}
                </div>
              )) : <AdminEmptyState title="No purchase orders yet" body="Low-stock alerts and supplier planning are easier when POs are tracked right here." action={canManageProcurement ? <AdminButton onClick={openCreatePoModal}>Create PO</AdminButton> : undefined} />}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSurfaceHeader title="Suggested actions" description="Prompt procurement before jobs slip." />
            <div className="space-y-3">
              {inventoryItems.filter((item) => item.onHand <= item.reorderPoint).length ? inventoryItems.filter((item) => item.onHand <= item.reorderPoint).map((item) => (
                <div key={item.id} className="rounded-[1.25rem] border border-[#dfc69d] bg-[#fbf6ed] px-4 py-4">
                  <p className="text-sm font-semibold text-tm-charcoal">{item.name}</p>
                  <p className="mt-1 text-sm text-tm-warm-gray">{item.onHand} {item.unit} remaining - reorder at {item.reorderPoint}</p>
                </div>
              )) : <AdminEmptyState title="No low-stock alerts" body="Current stock is above reorder point across the tracked material list." />}
            </div>
          </AdminSurface>
        </div>
      ) : null}

      {tab === 'library' ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <AdminSurface className="space-y-4">
            <AdminSurfaceHeader
              title="Website material library"
              description="These records power the public materials pages, configurator finishes, and material storytelling."
              action={canAdjustStock ? <AdminButton tone="secondary" onClick={openCreateMaterialModal}>Add website material</AdminButton> : null}
            />
            <SearchField value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search by timber, origin, or finish" />
            <div className="space-y-3">
              {filteredMaterials.length ? filteredMaterials.map((material) => (
                <AdminListRow
                  key={material.id}
                  title={material.name}
                  subtitle={`${material.origin} - ${material.availableFinishes.length} finishes`}
                  meta={material.bestFor.slice(0, 2).join(' • ') || 'Material profile'}
                  active={selectedMaterial?.id === material.id}
                  onClick={() => setSelectedLibraryId(material.id)}
                  status={<AdminStatusChip label={material.publishedToWebsite === true ? 'Visible' : 'Hidden'} tone={material.publishedToWebsite === true ? 'success' : 'neutral'} />}
                />
              )) : <AdminEmptyState title="No website materials yet" body="Create a material profile so the public site and configurator can present it properly." action={canAdjustStock ? <AdminButton onClick={openCreateMaterialModal}>Add website material</AdminButton> : undefined} />}
            </div>
          </AdminSurface>

          <AdminSurface>
            {selectedMaterial ? (
              <>
                <AdminSurfaceHeader
                  title={selectedMaterial.name}
                  description={`${selectedMaterial.origin} - website material profile`}
                  action={canAdjustStock ? (
                    <div className="flex flex-wrap gap-2">
                      <AdminButton tone="ghost" onClick={() => openEditMaterialModal(selectedMaterial)}>Edit material</AdminButton>
                      <AdminButton tone={selectedMaterial.publishedToWebsite === true ? 'ghost' : 'secondary'} disabled={isSavingLibrary} onClick={async () => { setPageError(''); try { setIsSavingLibrary(true); const nextPublishedState = selectedMaterial.publishedToWebsite !== true; await updateMaterial(selectedMaterial.id, { publishedToWebsite: nextPublishedState, visibleOnSite: nextPublishedState }); } catch (error) { console.error('Failed to update material website visibility:', error); setPageError('We could not update this material on the website right now.'); } finally { setIsSavingLibrary(false); } }}>{isSavingLibrary ? 'Saving...' : selectedMaterial.publishedToWebsite === true ? 'Hide from website' : 'Show on website'}</AdminButton>
                      <AdminButton tone="danger" disabled={isDeletingMaterial} onClick={async () => { if (!window.confirm(`Delete ${selectedMaterial.name}? This cannot be undone.`)) return; setPageError(''); setIsDeletingMaterial(true); try { await deleteMaterial(selectedMaterial.id); } catch (error) { console.error('Failed to delete material:', error); setPageError('We could not delete this website material right now.'); } finally { setIsDeletingMaterial(false); } }}>{isDeletingMaterial ? 'Deleting...' : 'Delete material'}</AdminButton>
                    </div>
                  ) : null}
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-[1.55rem] border border-black/6 bg-[#ede4d8]">
                    {selectedMaterial.grainImage ? <img src={selectedMaterial.grainImage} alt={selectedMaterial.name} className="aspect-[4/5] h-full w-full object-cover" /> : <div className="flex aspect-[4/5] items-center justify-center text-sm text-tm-warm-gray">No grain image added yet</div>}
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoBlock label="Origin" value={selectedMaterial.origin} />
                      <InfoBlock label="Website status" value={selectedMaterial.publishedToWebsite === true ? 'Visible on public site' : 'Hidden from public site'} />
                      <InfoBlock label="Tone" value={selectedMaterial.tone} />
                      <InfoBlock label="Accent tone" value={selectedMaterial.accentTone} />
                    </div>

                    <div className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Description</p>
                      <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{selectedMaterial.description}</p>
                    </div>

                    <div className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Character</p>
                      <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{selectedMaterial.character}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <TagCard label="Best for" items={selectedMaterial.bestFor} emptyText="No best-fit tags yet." />
                      <TagCard label="Available finishes" items={selectedMaterial.availableFinishes} emptyText="No finish options yet." />
                    </div>

                    <PublicShareTools
                      title={selectedMaterial.name}
                      url={`/materials/${selectedMaterial.id}`}
                      secondaryUrl={selectedMaterial.grainImage}
                      secondaryLabel="Copy grain image"
                    />
                  </div>
                </div>
              </>
            ) : <AdminEmptyState title="No website material selected" body="Choose a public material profile to inspect copy, tone, imagery, and website visibility." />}
          </AdminSurface>
        </div>
      ) : null}

      <AdminDrawer
        open={stockDrawerOpen}
        title={selectedItem ? `Adjust ${selectedItem.name}` : 'Adjust stock'}
        description="Use a focused drawer so the team can adjust quantity without losing visibility on the stock list."
        onClose={closeStockDrawer}
      >
        {selectedItem ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setStockError('');
              setIsSavingStock(true);
              try {
                const nextOnHand = stockForm.mode === 'receive' ? selectedItem.onHand + stockForm.quantity : Math.max(0, selectedItem.onHand - stockForm.quantity);
                await updateInventoryItem(selectedItem.id, { onHand: nextOnHand, reserved: Math.max(0, selectedItem.reserved + stockForm.reserve) });
                closeStockDrawer();
              } catch (error) {
                console.error('Failed to adjust stock:', error);
                setStockError('We could not save this stock adjustment right now.');
              } finally {
                setIsSavingStock(false);
              }
            }}
          >
            <Field label="Adjustment type"><SelectInput value={stockForm.mode} onChange={(event) => setStockForm((current) => ({ ...current, mode: event.target.value }))}><option value="receive">Receive stock</option><option value="consume">Consume stock</option></SelectInput></Field>
            <Field label="Quantity"><TextInput type="number" min={1} value={stockForm.quantity} onChange={(event) => setStockForm((current) => ({ ...current, quantity: Number(event.target.value || 1) }))} /></Field>
            <Field label="Reservation delta"><TextInput type="number" min={0} value={stockForm.reserve} onChange={(event) => setStockForm((current) => ({ ...current, reserve: Number(event.target.value || 0) }))} /></Field>
            {stockError ? <p className="rounded-[1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{stockError}</p> : null}
            <div className="flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingStock} onClick={closeStockDrawer}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingStock}>{isSavingStock ? 'Saving...' : 'Save adjustment'}</AdminButton></div>
          </form>
        ) : null}
      </AdminDrawer>

      <AdminModal
        open={itemModalOpen}
        title={editingItemId ? 'Edit stock item' : 'Add stock item'}
        description="Create or edit stock records so inventory, procurement, and jobs stay aligned."
        onClose={closeItemModal}
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setItemModalError('');
            setIsSavingItem(true);
            try {
              const payload = { name: itemForm.name, category: itemForm.category, unit: itemForm.unit, onHand: Number(itemForm.onHand || 0), reserved: Number(itemForm.reserved || 0), reorderPoint: Number(itemForm.reorderPoint || 0), supplier: itemForm.supplier, costPerUnit: Number(itemForm.costPerUnit || 0), eta: itemForm.eta };
              if (editingItemId) {
                await updateInventoryItem(editingItemId, payload);
              } else {
                const newItem = { id: generateId('inv'), ...payload };
                await addInventoryItem(newItem);
                setSelectedItemId(newItem.id);
              }
              closeItemModal();
            } catch (error) {
              console.error('Failed to save stock item:', error);
              setItemModalError('We could not save this stock item right now. Please try again.');
            } finally {
              setIsSavingItem(false);
            }
          }}
        >
          <Field label="Item name"><TextInput value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Mukwa boards" required /></Field>
          <Field label="Category"><SelectInput value={itemForm.category} onChange={(event) => setItemForm((current) => ({ ...current, category: event.target.value as InventoryItem['category'] }))}>{['Hardwood', 'Fabric', 'Hardware', 'Finishing'].map((category) => <option key={category} value={category}>{category}</option>)}</SelectInput></Field>
          <Field label="Unit"><TextInput value={itemForm.unit} onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))} placeholder="m3, rolls, pieces" /></Field>
          <Field label="Supplier"><TextInput value={itemForm.supplier} onChange={(event) => setItemForm((current) => ({ ...current, supplier: event.target.value }))} /></Field>
          <Field label="On hand"><TextInput type="number" min={0} value={itemForm.onHand} onChange={(event) => setItemForm((current) => ({ ...current, onHand: event.target.value }))} /></Field>
          <Field label="Reserved"><TextInput type="number" min={0} value={itemForm.reserved} onChange={(event) => setItemForm((current) => ({ ...current, reserved: event.target.value }))} /></Field>
          <Field label="Reorder point"><TextInput type="number" min={0} value={itemForm.reorderPoint} onChange={(event) => setItemForm((current) => ({ ...current, reorderPoint: event.target.value }))} /></Field>
          <Field label="Cost per unit"><TextInput type="number" min={0} value={itemForm.costPerUnit} onChange={(event) => setItemForm((current) => ({ ...current, costPerUnit: event.target.value }))} /></Field>
          <Field label="ETA"><TextInput type="date" value={itemForm.eta} onChange={(event) => setItemForm((current) => ({ ...current, eta: event.target.value }))} /></Field>
          {itemModalError ? <p className="sm:col-span-2 rounded-[1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{itemModalError}</p> : null}
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingItem} onClick={closeItemModal}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingItem}>{isSavingItem ? 'Saving...' : editingItemId ? 'Save changes' : 'Create stock item'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal
        open={poModalOpen}
        title={editingPoId ? 'Edit purchase order' : 'Create purchase order'}
        description="PO creation stays short and dedicated so procurement can act without cluttering the daily stock view."
        onClose={closePoModal}
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setPoModalError('');
            setIsSavingPo(true);
            try {
              if (editingPoId) {
                await updateAccountingRecord(editingPoId, { title: poForm.title, clientName: poForm.clientName, amount: Number(poForm.amount || 0), status: poForm.status, dueDate: poForm.dueDate });
              } else {
                const record: AccountingRecord = { id: generateId('acct'), type: 'Purchase Order', title: poForm.title, clientName: poForm.clientName, amount: Number(poForm.amount || 0), status: poForm.status, dueDate: poForm.dueDate, issuedDate: new Date().toISOString() };
                await addAccountingRecord(record);
              }
              closePoModal();
            } catch (error) {
              console.error('Failed to save purchase order:', error);
              setPoModalError('We could not save this purchase order right now. Please try again.');
            } finally {
              setIsSavingPo(false);
            }
          }}
        >
          <Field label="PO title"><TextInput value={poForm.title} onChange={(event) => setPoForm((current) => ({ ...current, title: event.target.value }))} placeholder="PO - Walnut slabs" required /></Field>
          <Field label="Supplier / linked client"><TextInput value={poForm.clientName} onChange={(event) => setPoForm((current) => ({ ...current, clientName: event.target.value }))} placeholder="Supplier name" /></Field>
          <Field label="Amount"><TextInput type="number" min={0} value={poForm.amount} onChange={(event) => setPoForm((current) => ({ ...current, amount: event.target.value }))} /></Field>
          <Field label="Due date"><TextInput type="date" value={poForm.dueDate} onChange={(event) => setPoForm((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
          <Field label="Status"><SelectInput value={poForm.status} onChange={(event) => setPoForm((current) => ({ ...current, status: event.target.value as AccountingRecord['status'] }))}>{['Draft', 'Issued', 'Paid', 'Overdue'].map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput></Field>
          {poModalError ? <p className="sm:col-span-2 rounded-[1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{poModalError}</p> : null}
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingPo} onClick={closePoModal}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingPo}>{isSavingPo ? 'Saving...' : editingPoId ? 'Save changes' : 'Create PO'}</AdminButton></div>
        </form>
      </AdminModal>

      <AdminModal
        open={libraryModalOpen}
        title={editingMaterialId ? 'Edit website material' : 'Add website material'}
        description="These fields power the public material pages and the configurator's material storytelling."
        onClose={closeLibraryModal}
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setLibraryModalError('');
            setIsSavingLibrary(true);
            try {
              const materialId = editingMaterialId ?? createMaterialId(libraryForm.name, adminMaterials.map((material) => material.id));
              const existingMaterial = adminMaterials.find((material) => material.id === materialId);
              const uploadedGrain = grainFile ? await uploadWebsiteMedia('materials', materialId, 'grain', grainFile) : null;
              const publishedToWebsite = libraryForm.visibleOnSite === 'true';
              const payload = { name: libraryForm.name, origin: libraryForm.origin, description: libraryForm.description, character: libraryForm.character, bestFor: parseList(libraryForm.bestFor), grainImage: uploadedGrain?.url || libraryForm.grainImage || existingMaterial?.grainImage || '', grainImagePath: uploadedGrain?.path ?? existingMaterial?.grainImagePath ?? undefined, tone: libraryForm.tone, accentTone: libraryForm.accentTone, availableFinishes: parseList(libraryForm.availableFinishes), sortOrder: Number(libraryForm.sortOrder || 100), publishedToWebsite, visibleOnSite: publishedToWebsite };

              if (editingMaterialId) {
                await updateMaterial(editingMaterialId, payload);
                if (publishedToWebsite) {
                  setSelectedLibraryId(editingMaterialId);
                }
              } else {
                await addMaterial({ id: materialId, ...payload });
                if (publishedToWebsite) {
                  setSelectedLibraryId(materialId);
                }
              }

              closeLibraryModal();
            } catch (error) {
              console.error('Failed to save website material:', error);
              setLibraryModalError('We could not save this website material right now. Please try again.');
            } finally {
              setIsSavingLibrary(false);
            }
          }}
        >
          <Field label="Material name"><TextInput value={libraryForm.name} onChange={(event) => setLibraryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Mukwa" required /></Field>
          <Field label="Origin"><TextInput value={libraryForm.origin} onChange={(event) => setLibraryForm((current) => ({ ...current, origin: event.target.value }))} placeholder="Zambia" /></Field>
          <Field label="Tone"><TextInput value={libraryForm.tone} onChange={(event) => setLibraryForm((current) => ({ ...current, tone: event.target.value }))} placeholder="#8c6643" /></Field>
          <Field label="Accent tone"><TextInput value={libraryForm.accentTone} onChange={(event) => setLibraryForm((current) => ({ ...current, accentTone: event.target.value }))} placeholder="#b58a57" /></Field>
          <Field label="Best for"><TextInput value={libraryForm.bestFor} onChange={(event) => setLibraryForm((current) => ({ ...current, bestFor: event.target.value }))} placeholder="Dining tables, feature cabinetry" /></Field>
          <Field label="Available finishes"><TextInput value={libraryForm.availableFinishes} onChange={(event) => setLibraryForm((current) => ({ ...current, availableFinishes: event.target.value }))} placeholder="Natural oil, Satin lacquer, Matte seal" /></Field>
          <Field label="Website status"><SelectInput value={libraryForm.visibleOnSite} onChange={(event) => setLibraryForm((current) => ({ ...current, visibleOnSite: event.target.value }))}><option value="true">Visible on website</option><option value="false">Hidden from website</option></SelectInput></Field>
          <Field label="Sort order"><TextInput type="number" min={0} value={libraryForm.sortOrder} onChange={(event) => setLibraryForm((current) => ({ ...current, sortOrder: event.target.value }))} /></Field>
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <Field label="Upload from device"><TextInput type="file" accept="image/*" onChange={(event) => setGrainFile(event.target.files?.[0] ?? null)} /></Field>
            <Field label="Or paste an image URL"><TextInput value={libraryForm.grainImage} onChange={(event) => setLibraryForm((current) => ({ ...current, grainImage: event.target.value }))} placeholder="https://..." /></Field>
          </div>
          <Field label="Description"><TextArea value={libraryForm.description} onChange={(event) => setLibraryForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[110px]" /></Field>
          <Field label="Character"><TextArea value={libraryForm.character} onChange={(event) => setLibraryForm((current) => ({ ...current, character: event.target.value }))} className="min-h-[110px]" /></Field>
          {libraryModalError ? <p className="sm:col-span-2 rounded-[1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{libraryModalError}</p> : null}
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingLibrary} onClick={closeLibraryModal}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingLibrary}>{isSavingLibrary ? 'Saving...' : editingMaterialId ? 'Save changes' : 'Create website material'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}

function TagCard({ label, items, emptyText }: { label: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/7 bg-[#fffdf9] px-4 py-4">
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? items.map((item) => (
          <span key={item} className="rounded-full border border-black/8 px-3 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-tm-warm-gray">
            {item}
          </span>
        )) : <span className="text-sm text-tm-warm-gray">{emptyText}</span>}
      </div>
    </div>
  );
}
