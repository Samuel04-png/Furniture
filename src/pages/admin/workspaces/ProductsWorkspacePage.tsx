import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AdminAnchorButton, AdminButton, AdminEmptyState, AdminListRow, AdminModal, AdminPage, AdminPageHeader, AdminStatusChip, AdminSubnav, AdminSurface, AdminSurfaceHeader } from '../../../components/admin/AdminUi';
import { PublicShareTools } from '../../../components/admin/PublicShareTools';
import { canPerform } from '../../../lib/adminAccess';
import { backfillPublishedProducts } from '../../../lib/backend/services/adminFunctions';
import { uploadProductMedia } from '../../../lib/backend/services/storage';
import { cn, formatCurrency, generateId, slugify } from '../../../lib/utils';
import { useTailoredStore } from '../../../store/useTailoredStore';
import type { Product, ProductCategory, ProductStatus } from '../../../types';
import { Field, mapProductCategoryToOverlay, productChecklist, productsTabs, SearchField, SelectInput, TextArea, TextInput, toneForProduct, useActiveAdmin } from './shared';

const createDefaultProductForm = () => ({
  name: '',
  slug: '',
  category: 'Seating' as ProductCategory,
  room: 'Living' as Product['room'],
  style: 'Contemporary' as Product['style'],
  status: 'Draft' as ProductStatus,
  priceFrom: '',
  leadTime: '6 - 8 weeks',
  materials: [] as string[],
  width: '220',
  depth: '100',
  height: '78',
  heroImage: '',
  cardImage: '',
  summary: '',
});

export function ProductsWorkspacePage() {
  const params = useParams();
  const tab = productsTabs.includes(params.tab as (typeof productsTabs)[number]) ? (params.tab as (typeof productsTabs)[number]) : 'library';
  const activeMember = useActiveAdmin();
  const products = useTailoredStore((state) => state.adminProducts);
  const adminMaterials = useTailoredStore((state) => state.adminMaterials);
  const createProduct = useTailoredStore((state) => state.addProduct);
  const updateProduct = useTailoredStore((state) => state.updateProduct);
  const deleteProduct = useTailoredStore((state) => state.deleteProduct);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(products[0]?.id);
  const [search, setSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [backfillMessage, setBackfillMessage] = useState('');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [form, setForm] = useState(createDefaultProductForm());
  const [modalError, setModalError] = useState('');
  const [pageError, setPageError] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isRunningBackfill, setIsRunningBackfill] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const base = products.filter((product) => `${product.name} ${product.category} ${product.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
    return base.filter((product) => (tab === 'library' ? true : product.publishedToWebsite === true));
  }, [products, search, tab]);

  const selectedProduct = visibleProducts.find((product) => product.id === selectedProductId) ?? visibleProducts[0];
  const isPublishingTab = tab === 'publishing';
  const canCreateProducts = canPerform('product.create', activeMember?.role);
  const canEditProducts = canPerform('product.edit', activeMember?.role) || canPerform('product.publish', activeMember?.role);
  const canPublishProducts = canPerform('product.publish', activeMember?.role);
  const canDeleteProducts = canPerform('product.publish', activeMember?.role);

  const resetForm = () => {
    setForm(createDefaultProductForm());
    setHeroFile(null);
    setCardFile(null);
  };

  const closeProductModal = () => {
    setProductModalOpen(false);
    setEditingProductId(null);
    setModalError('');
    resetForm();
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    setModalError('');
    resetForm();
    setProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setModalError('');
    setHeroFile(null);
    setCardFile(null);
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category,
      room: product.room,
      style: product.style,
      status: product.status,
      priceFrom: String(product.priceFrom),
      leadTime: product.leadTime,
      materials: product.materials,
      width: String(product.dimensions.width),
      depth: String(product.dimensions.depth),
      height: String(product.dimensions.height),
      heroImage: product.heroImage,
      cardImage: product.cardImage,
      summary: product.summary,
    });
    setProductModalOpen(true);
  };

  useEffect(() => {
    if (!visibleProducts.length) {
      if (selectedProductId) setSelectedProductId(undefined);
      return;
    }
    if (!visibleProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(visibleProducts[0].id);
    }
  }, [selectedProductId, visibleProducts]);

  useEffect(() => {
    setDetailsPanelOpen(false);
  }, [selectedProductId, tab]);

  const workspacePanelHeightClass = 'box-border md:h-[calc(100dvh-16.5rem)]';
  const canShowDetailsToggle = Boolean(selectedProduct) && !isPublishingTab;

  return (
    <AdminPage className="min-w-0 overflow-x-hidden">
      <AdminPageHeader eyebrow="Products" title="Internal product master data and website publishing, deliberately separated." description="This workspace keeps the product library clean for operations while giving merchandising and publishing their own focused surface. Products can now be added, edited, published, and deleted from one place." actions={<div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">{canPublishProducts ? <AdminButton tone="ghost" disabled={isRunningBackfill} onClick={async () => { setPageError(''); setBackfillMessage(''); setIsRunningBackfill(true); try { const result = await backfillPublishedProducts(); setBackfillMessage(`Website sync refreshed for ${result.publishedCount} of ${result.totalProducts} products.`); } catch (error) { console.error(error); setPageError('Website sync backfill failed. Check Cloud Functions deployment and permissions.'); } finally { setIsRunningBackfill(false); } }}>{isRunningBackfill ? 'Refreshing sync...' : 'Backfill website sync'}</AdminButton> : null}{canCreateProducts ? <AdminButton onClick={openCreateModal}>Add product</AdminButton> : null}</div>} />

      <AdminSubnav className="flex-wrap overflow-visible pb-0" items={[{ label: 'Library', href: '/admin/products/library', active: tab === 'library', count: products.length }, { label: 'Publishing', href: '/admin/products/publishing', active: tab === 'publishing', count: products.filter((product) => product.publishedToWebsite === true).length }]} />

      {pageError ? <div className="rounded-[1.2rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{pageError}</div> : null}
      {backfillMessage ? <div className="rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] px-4 py-3 text-sm text-tm-warm-gray">{backfillMessage}</div> : null}

      {isPublishingTab ? (
        <div className="grid min-h-0 gap-6 min-[1200px]:grid-cols-[minmax(0,1.45fr)_minmax(320px,420px)]">
          <AdminSurface className={cn('flex min-h-[22rem] flex-col overflow-hidden', workspacePanelHeightClass)}>
            <AdminSurfaceHeader title="Publishing queue" description="Products that need review, polish, or a final publishing decision." action={canCreateProducts ? <AdminButton tone="secondary" onClick={openCreateModal}>Add product</AdminButton> : null} />
            <div className="mb-4 shrink-0 rounded-[1.15rem] border border-black/5 bg-[rgba(250,247,244,0.86)] p-2.5 shadow-[0_8px_20px_rgba(12,12,12,0.03)]">
              <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories, or tags" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {visibleProducts.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className={`flex h-full min-h-[22rem] min-w-0 flex-col overflow-hidden rounded-[1.3rem] border text-left transition duration-200 ease-out ${selectedProduct?.id === product.id ? 'border-[#d8c19b] bg-[#fbf6ef] shadow-[0_10px_24px_rgba(12,12,12,0.06)]' : 'border-black/7 bg-white hover:border-black/12 hover:bg-[#fbf7f1] hover:shadow-[0_10px_24px_rgba(12,12,12,0.05)]'}`}
                    >
                      <ProductImageFrame imageUrl={product.cardImage || product.heroImage} alt={product.name} />
                      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <AdminStatusChip label={product.status} tone={toneForProduct(product.status)} />
                          {product.publishedToWebsite ? <AdminStatusChip label="Published" tone="success" /> : <AdminStatusChip label="Draft site sync" tone="neutral" />}
                        </div>
                        <div className="min-h-[3.5rem]">
                          <p className="truncate text-base font-semibold text-tm-charcoal">{product.name}</p>
                          <p className="mt-1 text-sm text-tm-warm-gray">{product.category} - {formatCurrency(product.priceFrom)}</p>
                        </div>
                        <p className="text-sm leading-6 text-tm-warm-gray">{product.summary || 'Add a short summary before publishing this product live.'}</p>
                        <p className="mt-auto text-[0.7rem] uppercase tracking-[0.18em] text-tm-warm-gray">{product.leadTime || 'Lead time pending'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : <AdminEmptyState title="No products match this filter" body="Clear the search or create a new product record to keep the library tidy." action={canCreateProducts ? <AdminButton onClick={openCreateModal}>Add product</AdminButton> : undefined} />}
            </div>
          </AdminSurface>

          <AdminSurface className={cn('flex min-h-[22rem] flex-col overflow-hidden', workspacePanelHeightClass)}>
            {selectedProduct ? (
              <>
                <div className="mb-5 flex flex-col gap-4 border-b border-black/6 pb-5">
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <h2 className="break-words text-[1.3rem] font-semibold tracking-[-0.02em] text-tm-charcoal">{selectedProduct.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{selectedProduct.category} - {selectedProduct.room} - {selectedProduct.style}</p>
                    </div>
                    {canEditProducts ? (
                      <div className="flex flex-wrap gap-2 overflow-visible">
                        <AdminButton className="whitespace-nowrap" tone="ghost" onClick={() => openEditModal(selectedProduct)}>Edit product</AdminButton>
                        {canPublishProducts ? <AdminButton className="whitespace-nowrap" tone="secondary" disabled={isTogglingPublish} onClick={async () => { setPageError(''); setIsTogglingPublish(true); try { const nextPublishedState = selectedProduct.publishedToWebsite !== true; await updateProduct(selectedProduct.id, { publishedToWebsite: nextPublishedState, website: { ...selectedProduct.website, isPublished: nextPublishedState, visibility: nextPublishedState ? 'public' : 'internal', publishedAt: nextPublishedState ? selectedProduct.website?.publishedAt ?? new Date().toISOString() : null, publishedBy: nextPublishedState ? selectedProduct.website?.publishedBy ?? activeMember?.id ?? null : null } }); } catch (error) { console.error('Failed to toggle product publishing:', error); setPageError('We could not update website publishing for this product right now.'); } finally { setIsTogglingPublish(false); } }}>{isTogglingPublish ? 'Saving...' : selectedProduct.publishedToWebsite ? 'Move to draft' : 'Publish to website'}</AdminButton> : null}
                        <AdminAnchorButton className="whitespace-nowrap" href={`/collections/${selectedProduct.slug}`} target="_blank" rel="noreferrer" tone="ghost"><ExternalLink className="h-4 w-4" />Open live page</AdminAnchorButton>
                        {canDeleteProducts ? (
                          <AdminButton
                            className="whitespace-nowrap"
                            tone="danger"
                            disabled={isDeletingProduct}
                            onClick={async () => {
                              if (!window.confirm(`Delete ${selectedProduct.name}? This will remove it from admin and the website sync.`)) return;
                              setPageError('');
                              setIsDeletingProduct(true);
                              try {
                                await deleteProduct(selectedProduct.id);
                              } catch (error) {
                                console.error('Failed to delete product:', error);
                                setPageError('We could not delete this product right now.');
                              } finally {
                                setIsDeletingProduct(false);
                              }
                            }}
                          >
                            {isDeletingProduct ? 'Deleting...' : 'Delete product'}
                          </AdminButton>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
                    <div className="space-y-5">
                      <ProductImageFrame imageUrl={selectedProduct.cardImage || selectedProduct.heroImage} alt={selectedProduct.name} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <MetricCard label="Price from" value={formatCurrency(selectedProduct.priceFrom)} />
                        <MetricCard label="Lead time" value={selectedProduct.leadTime} />
                        <MetricCard label="Publish readiness" value={`${productChecklist(selectedProduct)}/5`} />
                        <MetricCard label="Room" value={selectedProduct.room} />
                        <MetricCard label="Style" value={selectedProduct.style} />
                        <MetricCard label="Status" value={selectedProduct.status} />
                        <MetricCard label="Gallery assets" value={String(selectedProduct.gallery.length)} />
                      </div>
                    </div>
                    <ProductSidebarPanel product={selectedProduct} isPublishingTab />
                  </div>
                </div>
              </>
            ) : <AdminEmptyState title="No product selected" body="Choose a product to review pricing, lead time, imagery, and publishing readiness." />}
          </AdminSurface>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-col gap-6 overflow-hidden md:flex-row md:items-stretch">
          <AdminSurface className={cn('flex min-h-[22rem] min-w-0 flex-col overflow-hidden md:w-[240px] md:min-w-[240px] min-[1200px]:w-[280px] min-[1200px]:min-w-[280px]', workspacePanelHeightClass)}>
            <div className="flex shrink-0 flex-col gap-4">
              <AdminSurfaceHeader title="Product library" description="Core product records for showroom, operations, and website." action={canCreateProducts ? <AdminButton tone="secondary" onClick={openCreateModal}>Add product</AdminButton> : null} />
              <div className="shrink-0 rounded-[1.15rem] border border-black/5 bg-[rgba(250,247,244,0.86)] p-2.5 shadow-[0_8px_20px_rgba(12,12,12,0.03)]">
                <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories, or tags" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pt-4 md:pr-1">
              {visibleProducts.length ? (
                <div className="flex gap-3 overflow-x-auto pb-1 md:block md:space-y-3 md:overflow-x-hidden md:pb-0">
                  {visibleProducts.map((product) => (
                    <AdminListRow
                      key={product.id}
                      title={product.name}
                      subtitle={`${product.category} - ${formatCurrency(product.priceFrom)}`}
                      meta={product.leadTime}
                      active={selectedProduct?.id === product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className="min-h-[6.15rem] w-[17.5rem] shrink-0 md:w-full"
                      status={<AdminStatusChip label={product.status} tone={toneForProduct(product.status)} />}
                    />
                  ))}
                </div>
              ) : <AdminEmptyState title="No products match this filter" body="Clear the search or create a new product record to keep the library tidy." action={canCreateProducts ? <AdminButton onClick={openCreateModal}>Add product</AdminButton> : undefined} />}
            </div>
          </AdminSurface>

          <AdminSurface className={cn('flex min-h-[22rem] min-w-0 flex-1 flex-col overflow-hidden', workspacePanelHeightClass)}>
            {selectedProduct ? (
              <>
                <div className="mb-5 flex flex-col gap-4 border-b border-black/6 pb-5">
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <h2 className="break-words text-[1.35rem] font-semibold tracking-[-0.02em] text-tm-charcoal">{selectedProduct.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{selectedProduct.category} - {selectedProduct.room} - {selectedProduct.style}</p>
                    </div>
                    {canEditProducts || canShowDetailsToggle ? (
                      <div className="flex flex-wrap gap-2 overflow-visible">
                        {canEditProducts ? <AdminButton className="whitespace-nowrap" tone="ghost" onClick={() => openEditModal(selectedProduct)}>Edit product</AdminButton> : null}
                        {canPublishProducts ? <AdminButton className="whitespace-nowrap" tone="secondary" disabled={isTogglingPublish} onClick={async () => { setPageError(''); setIsTogglingPublish(true); try { const nextPublishedState = selectedProduct.publishedToWebsite !== true; await updateProduct(selectedProduct.id, { publishedToWebsite: nextPublishedState, website: { ...selectedProduct.website, isPublished: nextPublishedState, visibility: nextPublishedState ? 'public' : 'internal', publishedAt: nextPublishedState ? selectedProduct.website?.publishedAt ?? new Date().toISOString() : null, publishedBy: nextPublishedState ? selectedProduct.website?.publishedBy ?? activeMember?.id ?? null : null } }); } catch (error) { console.error('Failed to toggle product publishing:', error); setPageError('We could not update website publishing for this product right now.'); } finally { setIsTogglingPublish(false); } }}>{isTogglingPublish ? 'Saving...' : selectedProduct.publishedToWebsite ? 'Move to draft' : 'Publish to website'}</AdminButton> : null}
                        {canEditProducts ? <AdminAnchorButton className="whitespace-nowrap" href={`/collections/${selectedProduct.slug}`} target="_blank" rel="noreferrer" tone="ghost"><ExternalLink className="h-4 w-4" />Open live page</AdminAnchorButton> : null}
                        {canDeleteProducts ? (
                          <AdminButton
                            className="whitespace-nowrap"
                            tone="danger"
                            disabled={isDeletingProduct}
                            onClick={async () => {
                              if (!window.confirm(`Delete ${selectedProduct.name}? This will remove it from admin and the website sync.`)) return;
                              setPageError('');
                              setIsDeletingProduct(true);
                              try {
                                await deleteProduct(selectedProduct.id);
                              } catch (error) {
                                console.error('Failed to delete product:', error);
                                setPageError('We could not delete this product right now.');
                              } finally {
                                setIsDeletingProduct(false);
                              }
                            }}
                          >
                            {isDeletingProduct ? 'Deleting...' : 'Delete product'}
                          </AdminButton>
                        ) : null}
                        {canShowDetailsToggle ? <AdminButton className="hidden whitespace-nowrap md:inline-flex min-[1200px]:hidden" tone="ghost" type="button" onClick={() => setDetailsPanelOpen((current) => !current)}>Details</AdminButton> : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-5">
                    <ProductImageFrame imageUrl={selectedProduct.cardImage || selectedProduct.heroImage} alt={selectedProduct.name} />

                    <div className="rounded-[1.3rem] border border-black/7 bg-[#fffdf9] p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Selected product</p>
                      <div className="mt-3 flex flex-col gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words text-[1.4rem] font-semibold tracking-[-0.02em] text-tm-charcoal">{selectedProduct.name}</h3>
                          <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{selectedProduct.category} - {selectedProduct.room} - {selectedProduct.style}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AdminStatusChip label={selectedProduct.status} tone={toneForProduct(selectedProduct.status)} />
                          {selectedProduct.publishedToWebsite ? <AdminStatusChip label="Published" tone="success" /> : <AdminStatusChip label="Draft site sync" tone="neutral" />}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <MetricCard label="Price from" value={formatCurrency(selectedProduct.priceFrom)} />
                      <MetricCard label="Lead time" value={selectedProduct.leadTime} />
                      <MetricCard label="Publish readiness" value={`${productChecklist(selectedProduct)}/5`} />
                      <MetricCard label="Room" value={selectedProduct.room} />
                      <MetricCard label="Style" value={selectedProduct.style} />
                      <MetricCard label="Status" value={selectedProduct.status} />
                      <MetricCard label="Gallery assets" value={String(selectedProduct.gallery.length)} />
                    </div>

                    <div className={cn('hidden md:block min-[1200px]:hidden', detailsPanelOpen ? 'block' : 'hidden')}>
                      <ProductSidebarPanel product={selectedProduct} isPublishingTab={false} />
                    </div>

                    <div className="md:hidden">
                      <ProductSidebarPanel product={selectedProduct} isPublishingTab={false} />
                    </div>
                  </div>
                </div>
              </>
            ) : <AdminEmptyState title="No product selected" body="Choose a product to review pricing, lead time, imagery, and publishing readiness." />}
          </AdminSurface>

          {selectedProduct ? (
            <AdminSurface className={cn('hidden min-w-[300px] flex-col overflow-hidden min-[1200px]:flex min-[1200px]:w-[300px] min-[1200px]:min-w-[300px]', workspacePanelHeightClass)}>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <ProductSidebarPanel product={selectedProduct} isPublishingTab={false} />
              </div>
            </AdminSurface>
          ) : null}
        </div>
      )}

      <AdminModal open={productModalOpen} title={editingProductId ? 'Edit product' : 'Add product'} description="Capture the product essentials here, then let publishing and operations work from the same clean record." onClose={closeProductModal}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => {
          event.preventDefault();
          setModalError('');
          setIsSavingProduct(true);
          try {
            const productId = editingProductId ?? generateId('product');
            const slug = slugify(form.slug || form.name);
            const existingProduct = products.find((product) => product.id === productId);
            const uploadedHero = heroFile ? await uploadProductMedia(productId, 'hero', heroFile) : null;
            const uploadedCard = cardFile ? await uploadProductMedia(productId, 'card', cardFile) : null;
            const heroImage = uploadedHero?.url || form.heroImage || existingProduct?.heroImage || '';
            const cardImage = uploadedCard?.url || form.cardImage || existingProduct?.cardImage || heroImage;
            const gallery = Array.from(new Set([heroImage, cardImage, ...(existingProduct?.gallery ?? [])].filter(Boolean)));
            const dimensions = {
              width: Number(form.width || 220),
              depth: Number(form.depth || 100),
              height: Number(form.height || 78),
            };
            const publishedToWebsite =
              existingProduct?.publishedToWebsite ??
              existingProduct?.website?.isPublished ??
              false;

            if (editingProductId && existingProduct) {
              await updateProduct(editingProductId, {
                slug,
                name: form.name,
                category: form.category,
                room: form.room,
                style: form.style,
                status: form.status,
                heroImage,
                cardImage,
                gallery,
                summary: form.summary,
                story: form.summary,
                description: form.summary,
                priceFrom: Number(form.priceFrom || 0),
                leadTime: form.leadTime,
                materials: form.materials,
                dimensions,
                sizePresets: [{ id: existingProduct.sizePresets[0]?.id ?? generateId('size'), label: 'Standard', dimensions }],
                overlayKind: mapProductCategoryToOverlay(form.category),
                publishedToWebsite,
                website: {
                  ...existingProduct.website,
                  isPublished: publishedToWebsite,
                  visibility: publishedToWebsite ? 'public' : 'internal',
                  storeTitle: form.name,
                  storeSummary: form.summary,
                  storeDescription: form.summary,
                  seoTitle: form.name,
                  seoDescription: form.summary,
                  publishedAt: publishedToWebsite ? existingProduct.website?.publishedAt ?? new Date().toISOString() : null,
                  publishedBy: publishedToWebsite ? existingProduct.website?.publishedBy ?? activeMember?.id ?? null : null,
                },
              });
            } else {
              const product: Product = {
                id: productId,
                slug,
                name: form.name,
                category: form.category,
                room: form.room,
                style: form.style,
                status: form.status,
                materials: form.materials,
                finishes: ['Matt', 'Medium Gloss', 'High Gloss'],
                heroImage,
                cardImage,
                gallery,
                summary: form.summary,
                story: form.summary,
                description: form.summary,
                dimensions,
                sizePresets: [{ id: generateId('size'), label: 'Standard', dimensions }],
                customDimensions: true,
                priceFrom: Number(form.priceFrom || 0),
                leadTime: form.leadTime,
                tags: [],
                overlayKind: mapProductCategoryToOverlay(form.category),
                processGallery: [],
                publishedToWebsite: false,
                website: {
                  isPublished: false,
                  visibility: 'internal',
                  featured: false,
                  featuredOrder: 999,
                  storeTitle: form.name,
                  storeSummary: form.summary,
                  storeDescription: form.summary,
                  seoTitle: form.name,
                  seoDescription: form.summary,
                  publishedAt: null,
                  publishedBy: null,
                },
              };
              await createProduct(product);
            }

            setSelectedProductId(productId);
            closeProductModal();
          } catch (error) {
            console.error('Failed to save product:', error);
            setModalError('We could not save this product right now. Please review the details and try again.');
          } finally {
            setIsSavingProduct(false);
          }
        }}>
          <Field label="Name"><TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} required /></Field>
          <Field label="Slug"><TextInput value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} /></Field>
          <Field label="Category"><SelectInput value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ProductCategory }))}>{['Seating', 'Tables', 'Storage', 'Beds', 'Office', 'Outdoor'].map((category) => <option key={category} value={category}>{category}</option>)}</SelectInput></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}>{['Draft', 'Live', 'Hidden'].map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput></Field>
          <Field label="Room"><SelectInput value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value as Product['room'] }))}>{['Living', 'Dining', 'Bedroom', 'Office', 'Outdoor'].map((room) => <option key={room} value={room}>{room}</option>)}</SelectInput></Field>
          <Field label="Style"><SelectInput value={form.style} onChange={(event) => setForm((current) => ({ ...current, style: event.target.value as Product['style'] }))}>{['Contemporary', 'Traditional', 'Organic', 'Minimalist'].map((style) => <option key={style} value={style}>{style}</option>)}</SelectInput></Field>
          <Field label="Price from"><TextInput type="number" min={0} value={form.priceFrom} onChange={(event) => setForm((current) => ({ ...current, priceFrom: event.target.value }))} /></Field>
          <Field label="Lead time"><TextInput value={form.leadTime} onChange={(event) => setForm((current) => ({ ...current, leadTime: event.target.value }))} /></Field>
          <Field label="Available materials">
            <SelectInput multiple value={form.materials} onChange={(event) => setForm((current) => ({ ...current, materials: Array.from(event.target.selectedOptions).map((option) => option.value) }))} className="min-h-[8rem]">
              {!adminMaterials.length ? <option disabled value="">No materials available yet</option> : null}
              {adminMaterials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Product description"><TextArea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-[110px]" /></Field>
          <Field label="Width (cm)"><TextInput type="number" min={0} value={form.width} onChange={(event) => setForm((current) => ({ ...current, width: event.target.value }))} /></Field>
          <Field label="Depth (cm)"><TextInput type="number" min={0} value={form.depth} onChange={(event) => setForm((current) => ({ ...current, depth: event.target.value }))} /></Field>
          <Field label="Height (cm)"><TextInput type="number" min={0} value={form.height} onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))} /></Field>
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <Field label="Upload hero from device"><TextInput type="file" accept="image/*" onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)} /></Field>
            <Field label="Or paste a hero image URL"><TextInput value={form.heroImage} onChange={(event) => setForm((current) => ({ ...current, heroImage: event.target.value }))} /></Field>
          </div>
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <Field label="Upload card from device"><TextInput type="file" accept="image/*" onChange={(event) => setCardFile(event.target.files?.[0] ?? null)} /></Field>
            <Field label="Or paste a card image URL"><TextInput value={form.cardImage} onChange={(event) => setForm((current) => ({ ...current, cardImage: event.target.value }))} /></Field>
          </div>
          {modalError ? <p className="sm:col-span-2 rounded-[1rem] border border-[#d9a8a8] bg-[#fff6f5] px-4 py-3 text-sm text-[#8f1e1e]">{modalError}</p> : null}
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" disabled={isSavingProduct} onClick={closeProductModal}>Cancel</AdminButton><AdminButton type="submit" disabled={isSavingProduct}>{isSavingProduct ? 'Saving...' : editingProductId ? 'Save changes' : 'Create product record'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}

function ProductImageFrame({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-black/6 bg-tm-off-white">
      <div className="aspect-[4/3] w-full bg-[#efe6d8]">
        {imageUrl ? (
          <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-tm-warm-gray">
            <ImageOff className="h-5 w-5" />
            <span>No image</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductSidebarPanel({ product, isPublishingTab }: { product: Product; isPublishingTab: boolean }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Summary</p>
        <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{product.summary || 'Add a short summary before publishing this product live.'}</p>
      </div>

      <div className="rounded-[1.3rem] border border-[#dfc69d] bg-[#fbf6ed] p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Publishing guidance</p>
        <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{isPublishingTab ? 'Use this view to confirm imagery, lead time, and the summary before sending customers to the product page.' : 'Keep the library rich enough for operations first. Publishing can happen only when imagery and messaging are presentation-ready.'}</p>
      </div>

      <PublicShareTools
        title={product.name}
        url={`/collections/${product.slug}`}
        secondaryUrl={product.heroImage || product.cardImage}
        secondaryLabel="Copy hero image"
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[6.9rem] flex-col rounded-[1.2rem] border border-black/7 bg-[#fffdf9] px-4 py-4">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</p>
      <p className="mt-3 break-words text-sm font-semibold leading-6 text-tm-charcoal">{value}</p>
    </div>
  );
}
