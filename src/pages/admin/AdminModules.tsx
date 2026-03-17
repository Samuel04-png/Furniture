import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Clock3, Download, Eye, TriangleAlert } from 'lucide-react';
import { EmptyPanel, InputField, MetricCard, SelectField, SectionIntro, StatusBadge, TextAreaField } from '../../components/primitives';
import { adminCredentials } from '../../data/content';
import { downloadCsv, formatCurrency, formatDateTime, generateId } from '../../lib/utils';
import { productionStages, useTailoredStore } from '../../store/useTailoredStore';
import { AccountingPage, InventoryPage, SettingsPage } from './AdminOpsExtras';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const loginAdmin = useTailoredStore((state) => state.loginAdmin);
  const [form, setForm] = useState({ email: adminCredentials.email, password: adminCredentials.password });
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0c0c0c,#1c1814)] px-4 py-20 text-tm-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg rounded-[2.2rem] border border-white/10 bg-[rgba(245,237,226,0.06)] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <SectionIntro eyebrow="Admin login" title="Tailored Manor operations" body="This demo version uses local authentication so you can enter the full admin system immediately." dark />
        <form
          className="mt-8 space-y-5"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            if (!loginAdmin(form.email, form.password)) {
              setError('Invalid credentials.');
              return;
            }
            navigate('/admin/dashboard');
          }}
        >
          <InputField label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <InputField label="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          {error ? <p className="rounded-[1rem] border border-tm-error/30 bg-tm-error/10 px-4 py-3 font-dm text-sm text-tm-error">{error}</p> : null}
          <button type="submit" className="w-full rounded-full bg-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal">
            Enter admin
          </button>
        </form>
        <p className="mt-6 font-dm text-sm leading-7 text-tm-cream/60">Demo credentials are prefilled: {adminCredentials.email} / {adminCredentials.password}</p>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const enquiries = useTailoredStore((state) => state.enquiries);
  const consultations = useTailoredStore((state) => state.consultations);
  const productionOrders = useTailoredStore((state) => state.productionOrders);
  const accounting = useTailoredStore((state) => state.accountingRecords);
  const inventoryItems = useTailoredStore((state) => state.inventoryItems);

  const revenue = accounting.filter((item) => item.status === 'Paid' && item.type !== 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const pipelineSummary = [
    { label: 'New', count: enquiries.filter((item) => item.status === 'New').length },
    { label: 'Quote Sent', count: enquiries.filter((item) => item.status === 'Quote Sent').length },
    { label: 'Negotiation', count: enquiries.filter((item) => item.status === 'Negotiation').length },
    { label: 'Won', count: enquiries.filter((item) => item.status === 'Won').length },
  ];
  const upcomingConsultations = useMemo(
    () =>
      [...consultations]
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 4),
    [consultations],
  );
  const lowStockItems = inventoryItems.filter((item) => item.onHand <= item.reorderPoint).slice(0, 4);
  const overdueRecords = accounting.filter((item) => item.status === 'Overdue').slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2.2rem] border border-black/8 bg-[linear-gradient(135deg,#1c1814,#0c0c0c)] p-6 text-tm-cream shadow-[0_30px_90px_rgba(12,12,12,0.16)] sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <SectionIntro
            eyebrow="Studio command"
            title="One workspace from first enquiry to final invoice."
            body="This dashboard now behaves like a proper operating layer: lead triage, consultation load, production visibility, stock attention, and cash signals all sit together."
            dark
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Review leads', '/admin/enquiries'],
              ['Check production', '/admin/production'],
              ['Audit inventory', '/admin/inventory'],
              ['Open accounting', '/admin/accounting'],
            ].map(([label, href]) => (
              <Link
                key={href}
                to={href}
                className="inline-flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/4 px-4 py-4 font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-cream/82 transition hover:border-tm-gold/40 hover:text-tm-cream"
              >
                {label}
                <ArrowUpRight className="h-4 w-4 text-tm-gold" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="New enquiries today" value={String(enquiries.filter((item) => item.status === 'New').length)} meta="Live across direct, configurator, and visualiser" />
        <MetricCard label="Active quote requests" value={String(enquiries.filter((item) => item.type === 'configurator').length)} meta="Open configuration-driven leads" />
        <MetricCard label="Consultations this week" value={String(consultations.length)} meta="From forms and admin scheduling" />
        <MetricCard label="Pieces in production" value={String(productionOrders.length)} meta="Linked to the production board" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <div className="mb-6 flex items-center justify-between">
            <SectionIntro eyebrow="Live feed" title="Latest enquiries" />
            <Link to="/admin/enquiries" className="font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-gold">View all</Link>
          </div>
          <div className="space-y-3">
            {enquiries.slice(0, 6).map((enquiry) => (
              <div key={enquiry.id} className="rounded-[1.4rem] border border-black/8 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-cormorant text-2xl tracking-[-0.03em] text-tm-obsidian">{enquiry.clientName}</p>
                    <p className="mt-2 font-dm text-sm text-tm-warm-gray">{enquiry.productNames.join(', ') || 'General enquiry'}</p>
                  </div>
                  <StatusBadge tone={enquiry.status === 'New' ? 'gold' : enquiry.status === 'Quote Sent' ? 'success' : 'neutral'}>
                    {enquiry.channel}
                  </StatusBadge>
                </div>
                <p className="mt-3 font-dm text-xs uppercase tracking-[0.18em] text-tm-warm-gray">{formatDateTime(enquiry.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
            <SectionIntro eyebrow="Revenue summary" title={formatCurrency(revenue)} body="Paid inflow currently captured in the local accounting module." />
          </div>
          <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
            <SectionIntro eyebrow="Lead pipeline" title="Current enquiry states" />
            <div className="mt-6 space-y-3">
              {pipelineSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[1rem] bg-[#f6f1e7] px-4 py-3 font-dm text-sm">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tm-gold/12 text-tm-gold">
              <Clock3 className="h-5 w-5" />
            </div>
            <SectionIntro eyebrow="Calendar focus" title="Upcoming consultations" />
          </div>
          <div className="mt-6 space-y-3">
            {upcomingConsultations.length ? upcomingConsultations.map((consultation) => (
              <div key={consultation.id} className="rounded-[1.3rem] border border-black/8 p-4">
                <p className="font-cormorant text-[1.7rem] leading-none tracking-[-0.03em] text-tm-obsidian">{consultation.clientName}</p>
                <p className="mt-2 font-dm text-sm text-tm-warm-gray">{formatDateTime(consultation.scheduledAt)}</p>
                <p className="mt-2 font-dm text-[0.68rem] uppercase tracking-[0.2em] text-tm-gold">{consultation.status}</p>
              </div>
            )) : <EmptyPanel title="No consultations queued" body="New bookings from the website and admin scheduler will appear here." />}
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tm-gold/12 text-tm-gold">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <SectionIntro eyebrow="Purchasing watch" title="Low stock items" />
          </div>
          <div className="mt-6 space-y-3">
            {lowStockItems.length ? lowStockItems.map((item) => (
              <div key={item.id} className="rounded-[1.3rem] border border-black/8 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-cormorant text-[1.7rem] leading-none tracking-[-0.03em] text-tm-obsidian">{item.name}</p>
                    <p className="mt-2 font-dm text-sm text-tm-warm-gray">{item.onHand} {item.unit} on hand</p>
                  </div>
                  <StatusBadge tone="error">Reorder</StatusBadge>
                </div>
                <p className="mt-2 font-dm text-[0.68rem] uppercase tracking-[0.2em] text-tm-warm-gray">Supplier: {item.supplier}</p>
              </div>
            )) : <EmptyPanel title="Stock looks healthy" body="Nothing has crossed the current reorder threshold." />}
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <SectionIntro eyebrow="Financial follow-up" title="Outstanding pressure points" />
          <div className="mt-6 space-y-3">
            {overdueRecords.length ? overdueRecords.map((record) => (
              <div key={record.id} className="rounded-[1.3rem] border border-black/8 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-cormorant text-[1.7rem] leading-none tracking-[-0.03em] text-tm-obsidian">{record.title}</p>
                    <p className="mt-2 font-dm text-sm text-tm-warm-gray">{record.clientName || 'Internal record'}</p>
                  </div>
                  <StatusBadge tone="error">{record.status}</StatusBadge>
                </div>
                <p className="mt-3 font-dm text-[0.72rem] uppercase tracking-[0.18em] text-tm-warm-gray">
                  {formatCurrency(record.amount)} due {record.dueDate}
                </p>
              </div>
            )) : <EmptyPanel title="No overdue records" body="Issued deposits and invoices are currently under control." />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnquiriesPage() {
  const enquiries = useTailoredStore((state) => state.enquiries);
  const team = useTailoredStore((state) => state.teamMembers);
  const updateEnquiry = useTailoredStore((state) => state.updateEnquiry);
  const assignEnquiry = useTailoredStore((state) => state.assignEnquiry);
  const addEnquiryNote = useTailoredStore((state) => state.addEnquiryNote);
  const [selectedId, setSelectedId] = useState(enquiries[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const selected = enquiries.find((item) => item.id === selectedId) ?? enquiries[0];
  const filtered = enquiries.filter((item) => statusFilter === 'All' || item.status === statusFilter);

  return (
    <div className="grid gap-8 xl:grid-cols-[0.86fr_1.14fr]">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionIntro eyebrow="CRM" title="All enquiries" />
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                'enquiries.csv',
                filtered.map((item) => ({
                  id: item.id,
                  client: item.clientName,
                  channel: item.channel,
                  status: item.status,
                  createdAt: item.createdAt,
                })),
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-warm-gray"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
        <SelectField label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>
          <option>New</option>
          <option>Consultation Scheduled</option>
          <option>Quote Sent</option>
          <option>Negotiation</option>
          <option>Won</option>
          <option>Lost</option>
        </SelectField>
        <div className="space-y-3">
          {filtered.map((enquiry) => (
            <button key={enquiry.id} type="button" onClick={() => setSelectedId(enquiry.id)} className={`w-full rounded-[1.5rem] border p-5 text-left ${selected?.id === enquiry.id ? 'border-tm-gold bg-[#f6f1e7]' : 'border-black/8 bg-white'}`}>
              <p className="font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{enquiry.clientName}</p>
              <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">{enquiry.productNames.join(', ') || 'General enquiry'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge tone="gold">{enquiry.channel}</StatusBadge>
                <StatusBadge>{enquiry.status}</StatusBadge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="space-y-6 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-cormorant text-[3rem] leading-none tracking-[-0.04em] text-tm-obsidian">{selected.clientName}</h2>
              <p className="mt-3 font-dm text-sm text-tm-warm-gray">{selected.phone} / {selected.email}</p>
            </div>
            <StatusBadge tone="gold">{selected.channel}</StatusBadge>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <SelectField label="Status" value={selected.status} onChange={(event) => updateEnquiry(selected.id, { status: event.target.value as never })}>
              <option>New</option>
              <option>Consultation Scheduled</option>
              <option>Quote Sent</option>
              <option>Negotiation</option>
              <option>Won</option>
              <option>Lost</option>
            </SelectField>
            <SelectField label="Assigned to" value={selected.assignedTo || ''} onChange={(event) => assignEnquiry(selected.id, event.target.value)}>
              {team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </SelectField>
          </div>

          {selected.visualiserScreenshot ? <img src={selected.visualiserScreenshot} alt={selected.clientName} className="h-72 w-full rounded-[1.6rem] object-cover" /> : null}
          {selected.configurationData ? <div className="rounded-[1.6rem] bg-[#f6f1e7] p-5"><p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Configuration</p><div className="mt-4 space-y-3 font-dm text-sm text-tm-warm-gray"><p>Piece: {selected.configurationData.productName}</p><p>Finish: {selected.configurationData.finish}</p><p>Dimensions: {selected.configurationData.dimensions.width} x {selected.configurationData.dimensions.depth} x {selected.configurationData.dimensions.height} cm</p></div></div> : null}

          <div>
            <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Communication log</p>
            <div className="mt-4 space-y-3">
              {selected.notes.length ? selected.notes.map((entry) => (
                <div key={entry.id} className="rounded-[1rem] border border-black/8 p-4">
                  <p className="font-dm text-sm text-tm-obsidian">{entry.message}</p>
                  <p className="mt-2 font-dm text-xs uppercase tracking-[0.18em] text-tm-warm-gray">{entry.author} - {formatDateTime(entry.createdAt)}</p>
                </div>
              )) : <EmptyPanel title="No notes yet" body="Internal notes, quote updates, and call summaries will appear here." />}
            </div>
          </div>
          <div className="space-y-4">
            <TextAreaField label="Internal note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
            <button
              type="button"
              disabled={!note.trim()}
              onClick={() => {
                addEnquiryNote(selected.id, 'Admin', note.trim());
                setNote('');
              }}
              className="rounded-full bg-tm-obsidian px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add note
            </button>
          </div>
        </div>
      ) : (
        <EmptyPanel title="No enquiries yet" body="New enquiries from the website, configurator, visualiser, and direct contact form will appear here." />
      )}
    </div>
  );
}

export function CataloguePage() {
  const products = useTailoredStore((state) => state.products);
  const materials = useTailoredStore((state) => state.materials);
  const updateProduct = useTailoredStore((state) => state.updateProduct);
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? '');
  const product = products.find((item) => item.id === selectedId) ?? products[0];

  if (!product) return <EmptyPanel title="No products" body="Add products to populate the catalogue." />;

  return (
    <div className="grid gap-8 xl:grid-cols-[0.86fr_1.14fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionIntro eyebrow="CMS" title="Furniture catalogue" />
          <Link to={`/collections/${product.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 font-dm text-[0.72rem] uppercase tracking-[0.22em] text-tm-warm-gray">
            <Eye className="h-4 w-4" />
            Preview
          </Link>
        </div>
        {products.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex w-full items-center gap-4 rounded-[1.5rem] border p-4 text-left ${item.id === product.id ? 'border-tm-gold bg-[#f6f1e7]' : 'border-black/8 bg-white'}`}>
            <img src={item.cardImage} alt={item.name} className="h-20 w-20 rounded-[1rem] object-cover" />
            <div>
              <p className="font-cormorant text-2xl tracking-[-0.03em] text-tm-obsidian">{item.name}</p>
              <p className="mt-2 font-dm text-xs uppercase tracking-[0.18em] text-tm-gold">{item.status}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
        <SectionIntro eyebrow="Edit product" title={product.name} />

        {/* Hero image preview */}
        <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-black/8">
          <div className="relative aspect-[16/7]">
            <img src={product.heroImage} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
              <div>
                <p className="font-dm text-[0.68rem] uppercase tracking-[0.22em] text-tm-gold">{product.category} / {product.status}</p>
                <p className="mt-1 font-cormorant text-3xl tracking-[-0.03em] text-tm-cream">{product.name}</p>
              </div>
              <div className="flex gap-2">
                <img src={product.cardImage} alt="Card" className="h-16 w-16 rounded-xl border-2 border-white/30 object-cover shadow-lg" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <InputField label="Name" value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} />
          <InputField label="Slug" value={product.slug} onChange={(event) => updateProduct(product.id, { slug: event.target.value })} />
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField label="Category" value={product.category} onChange={(event) => updateProduct(product.id, { category: event.target.value as never })}>
              <option>Seating</option><option>Tables</option><option>Storage</option><option>Beds</option><option>Office</option><option>Outdoor</option>
            </SelectField>
            <SelectField label="Status" value={product.status} onChange={(event) => updateProduct(product.id, { status: event.target.value as never })}>
              <option>Live</option><option>Draft</option><option>Hidden</option>
            </SelectField>
          </div>

          {/* Image URL fields */}
          <div className="rounded-[1.4rem] border border-black/8 bg-[#f6f1e7] p-5">
            <p className="mb-4 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Product images</p>
            <div className="space-y-4">
              <InputField label="Hero Image URL" value={product.heroImage} onChange={(event) => updateProduct(product.id, { heroImage: event.target.value })} />
              <InputField label="Card Image URL" value={product.cardImage} onChange={(event) => updateProduct(product.id, { cardImage: event.target.value })} />
            </div>
          </div>

          <TextAreaField label="Summary" rows={3} value={product.summary} onChange={(event) => updateProduct(product.id, { summary: event.target.value })} />
          <TextAreaField label="Story" rows={4} value={product.story} onChange={(event) => updateProduct(product.id, { story: event.target.value })} />
          <div className="grid gap-5 md:grid-cols-2">
            <InputField label="Price from" type="number" value={String(product.priceFrom)} onChange={(event) => updateProduct(product.id, { priceFrom: Number(event.target.value) })} />
            <InputField label="Lead time" value={product.leadTime} onChange={(event) => updateProduct(product.id, { leadTime: event.target.value })} />
          </div>

          {/* Overlay kind selector */}
          <div>
            <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Overlay kind (visualiser)</p>
            <div className="flex flex-wrap gap-2">
              {(['sofa', 'table', 'chair', 'cabinet', 'bed', 'desk', 'outdoor'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => updateProduct(product.id, { overlayKind: kind })}
                  className={`rounded-full border px-4 py-2 font-dm text-[0.68rem] uppercase tracking-[0.18em] ${product.overlayKind === kind ? 'border-tm-gold bg-tm-gold/10 text-tm-obsidian' : 'border-black/8 text-tm-warm-gray'}`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Available materials</p>
            <div className="flex flex-wrap gap-2">
              {materials.map((material) => (
                <button
                  key={material.id}
                  type="button"
                  onClick={() =>
                    updateProduct(product.id, {
                      materials: product.materials.includes(material.id)
                        ? product.materials.filter((item) => item !== material.id)
                        : [...product.materials, material.id],
                    })
                  }
                  className={`rounded-full border px-4 py-2 font-dm text-[0.68rem] uppercase tracking-[0.18em] ${product.materials.includes(material.id) ? 'border-tm-gold bg-tm-gold/10' : 'border-black/8'}`}
                >
                  {material.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VisualiserSessionsPage() {
  const sessions = useTailoredStore((state) => state.visualiserSessions);
  const updateVisualiserSessionStatus = useTailoredStore((state) => state.updateVisualiserSessionStatus);
  return (
    <div className="space-y-8">
      <SectionIntro eyebrow="Visualiser manager" title="Submitted room layouts" body="Sessions are useful for both direct lead follow-up and understanding what products are being placed most often." />
      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-[2rem] border border-black/8 bg-white p-5 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
            <img src={session.roomPhotoUrl} alt={session.roomName} className="h-64 w-full rounded-[1.4rem] object-cover" />
            <div className="mt-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-cormorant text-2xl tracking-[-0.03em] text-tm-obsidian">{session.clientName || 'Anonymous session'}</p>
                <p className="mt-2 font-dm text-sm text-tm-warm-gray">{session.placedItems.length} placed items - {formatDateTime(session.submittedAt)}</p>
              </div>
              <SelectField label="Status" value={session.status} onChange={(event) => updateVisualiserSessionStatus(session.id, event.target.value as never)} className="min-w-[12rem]">
                <option>New</option><option>Contacted</option><option>Consultation Booked</option><option>Closed</option>
              </SelectField>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsultationsPage() {
  const consultations = useTailoredStore((state) => state.consultations);
  const team = useTailoredStore((state) => state.teamMembers);
  const updateConsultation = useTailoredStore((state) => state.updateConsultation);
  return (
    <div className="space-y-8">
      <SectionIntro eyebrow="Calendar" title="Consultation schedule" body="This view consolidates auto-created bookings from the website with manual admin adjustments." />
      <div className="grid gap-4 lg:grid-cols-2">
        {consultations.map((consultation) => (
          <div key={consultation.id} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_20px_60px_rgba(12,12,12,0.06)]">
            <p className="font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{consultation.clientName}</p>
            <p className="mt-3 font-dm text-sm text-tm-warm-gray">{formatDateTime(consultation.scheduledAt)}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SelectField label="Assigned designer" value={consultation.assignedDesigner} onChange={(event) => updateConsultation(consultation.id, { assignedDesigner: event.target.value })}>
                {team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </SelectField>
              <SelectField label="Status" value={consultation.status} onChange={(event) => updateConsultation(consultation.id, { status: event.target.value as never })}>
                <option>Scheduled</option><option>Completed</option><option>Rescheduled</option><option>Cancelled</option>
              </SelectField>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductionPage() {
  const orders = useTailoredStore((state) => state.productionOrders);
  const moveProductionOrder = useTailoredStore((state) => state.moveProductionOrder);
  const [draggingId, setDraggingId] = useState('');
  return (
    <div className="space-y-8">
      <SectionIntro eyebrow="Kanban board" title="Production workflow" body="Cards can be dragged between columns to move the order through the workshop pipeline." />
      <div className="grid gap-4 xl:grid-cols-6">
        {productionStages.map((stage) => (
          <div
            key={stage}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => draggingId && moveProductionOrder(draggingId, stage)}
            className="min-h-[16rem] rounded-[1.6rem] border border-black/8 bg-white p-4 shadow-[0_20px_60px_rgba(12,12,12,0.05)]"
          >
            <h3 className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{stage}</h3>
            <div className="mt-4 space-y-3">
              {orders.filter((order) => order.status === stage).map((order) => (
                <div key={order.id} draggable onDragStart={() => setDraggingId(order.id)} className="rounded-[1rem] border border-black/8 bg-[#f6f1e7] p-4">
                  <p className="font-cormorant text-xl tracking-[-0.03em] text-tm-obsidian">{order.productName}</p>
                  <p className="mt-2 font-dm text-sm text-tm-warm-gray">{order.clientName}</p>
                  <p className="mt-2 font-dm text-xs uppercase tracking-[0.18em] text-tm-warm-gray">Due {order.deadline}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { InventoryPage, AccountingPage, SettingsPage };
