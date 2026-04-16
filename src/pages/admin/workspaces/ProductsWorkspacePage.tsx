import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AdminAnchorButton, AdminButton, AdminEmptyState, AdminListRow, AdminModal, AdminPage, AdminPageHeader, AdminStatusChip, AdminSubnav, AdminSurface, AdminSurfaceHeader, AdminToolbar } from '../../../components/admin/AdminUi';
import { canPerform } from '../../../lib/adminAccess';
import { backfillPublishedProducts } from '../../../lib/backend/services/adminFunctions';
import { uploadProductMedia } from '../../../lib/backend/services/storage';
import { copyText, formatCurrency, generateId, slugify } from '../../../lib/utils';
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
  heroImage: '',
  cardImage: '',
  summary: '',
});

export function ProductsWorkspacePage() {
  const params = useParams();
  const tab = productsTabs.includes(params.tab as (typeof productsTabs)[number]) ? (params.tab as (typeof productsTabs)[number]) : 'library';
  const activeMember = useActiveAdmin();
  const products = useTailoredStore((state) => state.adminProducts);
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

  const visibleProducts = useMemo(() => {
    const base = products.filter((product) => `${product.name} ${product.category} ${product.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
    return base.filter((product) => (tab === 'library' ? true : product.status !== 'Hidden'));
  }, [products, search, tab]);

  const selectedProduct = visibleProducts.find((product) => product.id === selectedProductId) ?? visibleProducts[0];
  const canCreateProducts = canPerform('product.create', activeMember?.role);
  const canEditProducts = canPerform('product.edit', activeMember?.role) || canPerform('product.publish', activeMember?.role);
  const canPublishProducts = canPerform('product.publish', activeMember?.role);
  const canDeleteProducts = canPerform('product.publish', activeMember?.role);

  const resetForm = () => {
    setForm(createDefaultProductForm());
    setHeroFile(null);
    setCardFile(null);
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    resetForm();
    setProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
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

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Products" title="Internal product master data and website publishing, deliberately separated." description="This workspace keeps the product library clean for operations while giving merchandising and publishing their own focused surface. Products can now be added, edited, published, and deleted from one place." actions={<div className="flex flex-wrap gap-2">{canPublishProducts ? <AdminButton tone="ghost" onClick={() => { void backfillPublishedProducts().then((result) => setBackfillMessage(`Website sync refreshed for ${result.publishedCount} of ${result.totalProducts} products.`)).catch((error) => { console.error(error); setBackfillMessage('Website sync backfill failed. Check Cloud Functions deployment and permissions.'); }); }}>Backfill website sync</AdminButton> : null}{canCreateProducts ? <AdminButton onClick={openCreateModal}>Add product</AdminButton> : null}</div>} />

      <AdminSubnav items={[{ label: 'Library', href: '/admin/products/library', active: tab === 'library', count: products.length }, { label: 'Publishing', href: '/admin/products/publishing', active: tab === 'publishing', count: products.filter((product) => product.website?.isPublished).length }]} />

      <AdminToolbar>
        <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories, or tags" />
      </AdminToolbar>
      {backfillMessage ? <div className="rounded-[1.2rem] border border-black/7 bg-[#fbf7f1] px-4 py-3 text-sm text-tm-warm-gray">{backfillMessage}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]">
        <AdminSurface className="space-y-3">
          <AdminSurfaceHeader title={tab === 'library' ? 'Product library' : 'Publishing queue'} description={tab === 'library' ? 'Core product records for showroom, operations, and website.' : 'Products that need review, polish, or a final publishing decision.'} action={canCreateProducts ? <AdminButton tone="secondary" onClick={openCreateModal}>Add product</AdminButton> : null} />
          {visibleProducts.length ? visibleProducts.map((product) => <AdminListRow key={product.id} title={product.name} subtitle={`${product.category} - ${formatCurrency(product.priceFrom)}`} meta={product.leadTime} active={selectedProduct?.id === product.id} onClick={() => setSelectedProductId(product.id)} status={<AdminStatusChip label={product.status} tone={toneForProduct(product.status)} />} />) : <AdminEmptyState title="No products match this filter" body="Clear the search or create a new product record to keep the library tidy." action={canCreateProducts ? <AdminButton onClick={openCreateModal}>Add product</AdminButton> : undefined} />}
        </AdminSurface>

        <AdminSurface>
          {selectedProduct ? (
            <>
              <AdminSurfaceHeader
                title={selectedProduct.name}
                description={`${selectedProduct.category} - ${selectedProduct.room} - ${selectedProduct.style}`}
                action={
                  canEditProducts ? (
                    <div className="flex flex-wrap gap-2">
                      <AdminButton tone="ghost" onClick={() => openEditModal(selectedProduct)}>Edit product</AdminButton>
                      {canPublishProducts ? <AdminButton tone="secondary" onClick={() => void updateProduct(selectedProduct.id, { status: selectedProduct.website?.isPublished ? 'Draft' : 'Live', website: { ...selectedProduct.website, isPublished: !selectedProduct.website?.isPublished, visibility: !selectedProduct.website?.isPublished ? 'public' : 'internal' } })}>{selectedProduct.website?.isPublished ? 'Move to draft' : 'Publish to website'}</AdminButton> : null}
                      <AdminAnchorButton href={`/collections/${selectedProduct.slug}`} target="_blank" rel="noreferrer" tone="ghost"><ExternalLink className="h-4 w-4" />Open live page</AdminAnchorButton>
                      {canDeleteProducts ? (
                        <AdminButton
                          tone="danger"
                          onClick={() => {
                            if (!window.confirm(`Delete ${selectedProduct.name}? This will remove it from admin and the website sync.`)) return;
                            void deleteProduct(selectedProduct.id);
                          }}
                        >
                          Delete product
                        </AdminButton>
                      ) : null}
                    </div>
                  ) : null
                }
              />

              <div className="grid gap-6 xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[1.55rem] border border-black/6 bg-[#ede4d8]">
                  <div className="aspect-[4/3]">{(selectedProduct.cardImage || selectedProduct.heroImage) ? <img src={selectedProduct.cardImage || selectedProduct.heroImage} alt={selectedProduct.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-tm-warm-gray">No image added yet</div>}</div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <MetricCard label="Price from" value={formatCurrency(selectedProduct.priceFrom)} />
                    <MetricCard label="Lead time" value={selectedProduct.leadTime} />
                    <MetricCard label="Publish readiness" value={`${productChecklist(selectedProduct)}/5`} />
                  </div>

                  <div className="rounded-[1.3rem] border border-black/7 bg-[#fbf7f1] p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Summary</p>
                    <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{selectedProduct.summary}</p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <MetricCard label="Room" value={selectedProduct.room} />
                    <MetricCard label="Style" value={selectedProduct.style} />
                    <MetricCard label="Status" value={selectedProduct.status} />
                    <MetricCard label="Gallery assets" value={String(selectedProduct.gallery.length)} />
                  </div>

                  <div className="rounded-[1.3rem] border border-[#dfc69d] bg-[#fbf6ed] p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Publishing guidance</p>
                    <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{tab === 'publishing' ? 'Use this view to confirm imagery, lead time, and the summary before sending customers to the product page.' : 'Keep the library rich enough for operations first. Publishing can happen only when imagery and messaging are presentation-ready.'}</p>
                  </div>

                  {tab === 'publishing' ? <AdminButton type="button" tone="ghost" onClick={() => void copyText(`${window.location.origin}/collections/${selectedProduct.slug}`)} className="justify-start sm:w-fit"><Copy className="h-4 w-4 text-tm-gold" />Copy website link</AdminButton> : null}
                </div>
              </div>
            </>
          ) : <AdminEmptyState title="No product selected" body="Choose a product to review pricing, lead time, imagery, and publishing readiness." />}
        </AdminSurface>
      </div>

      <AdminModal open={productModalOpen} title={editingProductId ? 'Edit product' : 'Add product'} description="Capture the product essentials here, then let publishing and operations work from the same clean record." onClose={() => { setProductModalOpen(false); setEditingProductId(null); resetForm(); }}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => {
          event.preventDefault();
          const productId = editingProductId ?? generateId('product');
          const slug = slugify(form.slug || form.name);
          const existingProduct = products.find((product) => product.id === productId);
          const uploadedHero = heroFile ? await uploadProductMedia(productId, 'hero', heroFile) : null;
          const uploadedCard = cardFile ? await uploadProductMedia(productId, 'card', cardFile) : null;
          const heroImage = uploadedHero?.url || form.heroImage || existingProduct?.heroImage || '';
          const cardImage = uploadedCard?.url || form.cardImage || existingProduct?.cardImage || heroImage;
          const gallery = Array.from(new Set([heroImage, cardImage, ...(existingProduct?.gallery ?? [])].filter(Boolean)));

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
              overlayKind: mapProductCategoryToOverlay(form.category),
              website: {
                ...existingProduct.website,
                isPublished: form.status === 'Live',
                visibility: form.status === 'Live' ? 'public' : existingProduct.website?.visibility ?? 'internal',
                storeTitle: form.name,
                storeSummary: form.summary,
                storeDescription: form.summary,
                seoTitle: form.name,
                seoDescription: form.summary,
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
              materials: [],
              finishes: [],
              heroImage,
              cardImage,
              gallery,
              summary: form.summary,
              story: form.summary,
              description: form.summary,
              dimensions: { width: 220, depth: 100, height: 78 },
              sizePresets: [{ id: generateId('size'), label: 'Standard', dimensions: { width: 220, depth: 100, height: 78 } }],
              customDimensions: true,
              priceFrom: Number(form.priceFrom || 0),
              leadTime: form.leadTime,
              tags: [],
              overlayKind: mapProductCategoryToOverlay(form.category),
              processGallery: [],
              website: {
                isPublished: form.status === 'Live',
                visibility: form.status === 'Live' ? 'public' : 'internal',
                featured: false,
                featuredOrder: 999,
                storeTitle: form.name,
                storeSummary: form.summary,
                storeDescription: form.summary,
                seoTitle: form.name,
                seoDescription: form.summary,
                publishedAt: form.status === 'Live' ? new Date().toISOString() : null,
                publishedBy: activeMember?.id ?? null,
              },
            };
            await createProduct(product);
          }

          setSelectedProductId(productId);
          setProductModalOpen(false);
          setEditingProductId(null);
          resetForm();
        }}>
          <Field label="Name"><TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} required /></Field>
          <Field label="Slug"><TextInput value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} required /></Field>
          <Field label="Category"><SelectInput value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ProductCategory }))}>{['Seating', 'Tables', 'Storage', 'Beds', 'Office', 'Outdoor'].map((category) => <option key={category} value={category}>{category}</option>)}</SelectInput></Field>
          <Field label="Status"><SelectInput value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}>{['Draft', 'Live', 'Hidden'].map((status) => <option key={status} value={status}>{status}</option>)}</SelectInput></Field>
          <Field label="Room"><SelectInput value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value as Product['room'] }))}>{['Living', 'Dining', 'Bedroom', 'Office', 'Outdoor'].map((room) => <option key={room} value={room}>{room}</option>)}</SelectInput></Field>
          <Field label="Style"><SelectInput value={form.style} onChange={(event) => setForm((current) => ({ ...current, style: event.target.value as Product['style'] }))}>{['Contemporary', 'Traditional', 'Organic', 'Minimalist'].map((style) => <option key={style} value={style}>{style}</option>)}</SelectInput></Field>
          <Field label="Price from"><TextInput type="number" min={0} value={form.priceFrom} onChange={(event) => setForm((current) => ({ ...current, priceFrom: event.target.value }))} /></Field>
          <Field label="Lead time"><TextInput value={form.leadTime} onChange={(event) => setForm((current) => ({ ...current, leadTime: event.target.value }))} /></Field>
          <Field label="Hero image URL"><TextInput value={form.heroImage} onChange={(event) => setForm((current) => ({ ...current, heroImage: event.target.value }))} required={!heroFile} /></Field>
          <Field label="Card image URL"><TextInput value={form.cardImage} onChange={(event) => setForm((current) => ({ ...current, cardImage: event.target.value }))} /></Field>
          <Field label="Hero image file"><TextInput type="file" accept="image/*" onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)} /></Field>
          <Field label="Card image file"><TextInput type="file" accept="image/*" onChange={(event) => setCardFile(event.target.files?.[0] ?? null)} /></Field>
          <Field label="Summary"><TextArea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-[110px]" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-3"><AdminButton type="button" tone="ghost" onClick={() => { setProductModalOpen(false); setEditingProductId(null); resetForm(); }}>Cancel</AdminButton><AdminButton type="submit">{editingProductId ? 'Save changes' : 'Create product record'}</AdminButton></div>
        </form>
      </AdminModal>
    </AdminPage>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/7 bg-[#fffdf9] px-4 py-4">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-tm-charcoal">{value}</p>
    </div>
  );
}
