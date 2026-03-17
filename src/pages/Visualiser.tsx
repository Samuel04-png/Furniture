import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Copy, Eraser, Expand, Grid3X3, Loader2, RotateCcw, Search, Trash2, Undo2, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';
import { InputField, SelectField, SectionIntro, TextAreaField } from '../components/primitives';
import { cn, copyText, createWhatsAppLink, generateId, prepareRoomImage } from '../lib/utils';
import Button from '../components/Button';
import { getSmartPlacement } from '../lib/gemini';
import { useTailoredStore } from '../store/useTailoredStore';
import type { Product } from '../types';

const categories = ['All', 'Seating', 'Tables', 'Storage', 'Beds', 'Office', 'Outdoor'] as const;

export default function Visualiser() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const products = useTailoredStore((state) => state.products);
  const materials = useTailoredStore((state) => state.materials);
  const sampleRooms = useTailoredStore((state) => state.sampleRooms);
  const draft = useTailoredStore((state) => state.visualiserDraft);
  const setDraft = useTailoredStore((state) => state.setVisualiserDraft);
  const resetDraft = useTailoredStore((state) => state.resetVisualiserDraft);
  const addItem = useTailoredStore((state) => state.addPlacedItem);
  const updateItem = useTailoredStore((state) => state.updatePlacedItem);
  const removeItem = useTailoredStore((state) => state.removePlacedItem);
  const clearItems = useTailoredStore((state) => state.clearPlacedItems);
  const saveSession = useTailoredStore((state) => state.saveVisualiserDraftSession);
  const loadSession = useTailoredStore((state) => state.loadVisualiserSession);
  const submitVisualiser = useTailoredStore((state) => state.createVisualiserSubmission);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [aiPlacementsRemaining, setAiPlacementsRemaining] = useState(3);
  const [form, setForm] = useState({ clientName: '', phone: '', email: '', date: '', time: '', notes: '' });
  const roomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stage = location.pathname.endsWith('/submit') ? 'submit' : location.pathname.endsWith('/canvas') ? 'canvas' : 'entry';
  const liveProducts = useMemo(() => products.filter((item) => item.status === 'Live'), [products]);

  useEffect(() => {
    const session = params.get('session');
    if (session && !draft.roomPhotoUrl) loadSession(session);
  }, [draft.roomPhotoUrl, loadSession, params]);

  useEffect(() => {
    const productId = params.get('product');
    if (stage !== 'canvas' || !draft.roomPhotoUrl || !productId || draft.items.length) return;
    const product = liveProducts.find((item) => item.id === productId);
    if (!product) return;
    addItem({
      id: generateId('placed'),
      productId: product.id,
      productName: product.name,
      materialId: params.get('material') && product.materials.includes(params.get('material')!) ? params.get('material')! : product.materials[0],
      x: 50,
      y: 68,
      scale: 1,
      rotation: 0,
      zIndex: 2,
    });
  }, [addItem, draft.items.length, draft.roomPhotoUrl, liveProducts, params, stage]);

  const filtered = useMemo(
    () =>
      liveProducts.filter((product) => {
        const q = search.toLowerCase();
        const bySearch = !q || product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q);
        const byCategory = category === 'All' || product.category === category;
        const byMaterial = materialFilter === 'all' || product.materials.includes(materialFilter);
        return bySearch && byCategory && byMaterial;
      }),
    [category, liveProducts, materialFilter, search],
  );

  const selectedItem = draft.items.find((item) => item.id === selectedId) ?? null;
  const selectedProduct = liveProducts.find((item) => item.id === selectedItem?.productId);
  const summaryItems = Array.from(
    draft.items.reduce((map, item) => {
      const key = `${item.productId}-${item.materialId}`;
      map.set(key, {
        productName: item.productName,
        materialId: item.materialId,
        quantity: (map.get(key)?.quantity ?? 0) + 1,
      });
      return map;
    }, new Map<string, { productName: string; materialId: string; quantity: number }>()),
  ).map(([, value]) => value);

  const upload = async (file: File) => {
    try {
      setError('');
      if (file.size > 20_000_000) throw new Error('Please upload a room photo under 20MB.');
      const prepared = await prepareRoomImage(file);
      setDraft({ roomPhotoUrl: prepared.dataUrl, roomName: file.name.replace(/\.[^.]+$/, ''), items: [], zoom: 1, gridEnabled: false });
      navigate('/visualise/canvas');
    } catch (message) {
      setError(message instanceof Error ? message.message : 'Unable to use this image.');
    }
  };

  const place = (product: Product) => {
    addItem({
      id: generateId('placed'),
      productId: product.id,
      productName: product.name,
      materialId: product.materials[0],
      x: 50,
      y: 68,
      scale: product.category === 'Tables' ? 0.9 : 1,
      rotation: 0,
      zIndex: Math.max(1, ...draft.items.map((item) => item.zIndex)) + 1,
    });
  };

  const autoPlace = async (product: Product) => {
    if (aiPlacementsRemaining <= 0) {
      // Fallback to manual if out of AI credits
      place(product);
      setFeedback('AI placement limit reached (3/3). Using standard placement.');
      return;
    }

    setLoadingAI(product.id);
    try {
      const placement = await getSmartPlacement(draft.roomPhotoUrl, product.category, product.name, draft.items.length);
      addItem({
        id: generateId('placed'),
        productId: product.id,
        productName: product.name,
        materialId: product.materials[0],
        x: placement.x,
        y: placement.y,
        scale: placement.scale,
        rotation: 0,
        zIndex: Math.max(1, ...draft.items.map((item) => item.zIndex)) + 1,
      });
      setAiPlacementsRemaining(prev => prev - 1);
      setFeedback(`Placed with AI ✨ (${aiPlacementsRemaining - 1} left)`);
    } catch (e) {
      console.error(e);
      place(product);
      setFeedback('AI placement fell back to standard.');
    } finally {
      setLoadingAI(null);
    }
  };

  const reposition = (id: string, event: MouseEvent | PointerEvent) => {
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) return;
    updateItem(id, {
      x: Math.min(95, Math.max(5, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(92, Math.max(12, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  };

  const cycleMaterial = (id: string) => {
    const item = draft.items.find((entry) => entry.id === id);
    const product = liveProducts.find((entry) => entry.id === item?.productId);
    if (!item || !product) return;
    const current = product.materials.indexOf(item.materialId);
    updateItem(id, { materialId: product.materials[(current + 1) % product.materials.length] });
  };

  const save = async (share = false) => {
    const sessionId = saveSession();
    if (share) {
      await copyText(`${window.location.origin}/visualise/canvas?session=${sessionId}`);
      setFeedback('Share link copied.');
    } else {
      setFeedback('Arrangement saved in this browser.');
    }
  };

  if (stage === 'entry') {
    return (
      <div className="bg-tm-charcoal px-4 pb-24 pt-36 text-tm-cream sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-dm text-[0.72rem] uppercase tracking-[0.3em] text-tm-gold">Launch visualiser</p>
          <h1 className="mt-6 font-cormorant text-[clamp(3rem,7vw,5.4rem)] leading-[0.95] tracking-[-0.04em]">See it in your space before you build it.</h1>
          <p className="mx-auto mt-6 max-w-3xl font-dm text-[1rem] leading-8 text-tm-cream/70">
            Upload a photo of your room, place any piece from the collection, adjust scale and finish, then send the layout straight to the admin team.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-5xl rounded-[2.4rem] border border-tm-gold/25 bg-[#f6f1e7] p-6 text-tm-obsidian shadow-[0_45px_120px_rgba(12,12,12,0.24)]">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) upload(file); }}
            className="flex min-h-[20rem] w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-tm-gold/50 bg-white px-6 text-center"
          >
            <div className="rounded-full bg-tm-gold/12 p-5 text-tm-gold"><Upload className="h-8 w-8" /></div>
            <h2 className="mt-6 font-cormorant text-[2.3rem] leading-none tracking-[-0.03em]">Drop a photo of your room here or click to browse</h2>
            <p className="mt-4 max-w-xl font-dm text-sm leading-7 text-tm-warm-gray">JPEG, PNG, and HEIC are supported. Photos stay in your browser until you submit them.</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
          </button>
          {error ? <p className="mt-4 rounded-[1rem] border border-tm-error/20 bg-tm-error/10 px-4 py-3 font-dm text-sm text-tm-error">{error}</p> : null}
          <div className="mt-10">
            <SectionIntro eyebrow="Example rooms" title="Or try one of our sample spaces" body="This keeps the feature useful even for first-time visitors." />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {sampleRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => { setDraft({ roomPhotoUrl: room.image, roomName: room.name, items: [], zoom: 1, gridEnabled: false }); navigate('/visualise/canvas'); }}
                  className="overflow-hidden rounded-[1.8rem] border border-black/10 bg-white text-left"
                >
                  <img src={room.image} alt={room.name} className="h-56 w-full object-cover" />
                  <div className="p-5">
                    <p className="font-dm text-[0.68rem] uppercase tracking-[0.24em] text-tm-gold">{room.spaceType}</p>
                    <h3 className="mt-3 font-cormorant text-[1.9rem] leading-none tracking-[-0.03em]">{room.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!draft.roomPhotoUrl) return <Navigate to="/visualise" replace />;

  if (stage === 'submit') {
    const whatsapp = createWhatsAppLink(`Hello Tailored Manor, I'd like to continue with my visualiser layout.\nPieces: ${summaryItems.map((item) => `${item.productName} x${item.quantity}`).join(', ')}`);
    return (
      <div className="bg-tm-off-white px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_30px_90px_rgba(12,12,12,0.08)]">
            <SectionIntro eyebrow="Layout preview" title="Your room plan is ready to send" body="The enquiry will include this room photo and the list of placed furniture." />
            <div className="mt-8 overflow-hidden rounded-[1.8rem] border border-black/8 bg-tm-charcoal">
              <div className="relative aspect-[4/3]">
                <img src={draft.roomPhotoUrl} alt={draft.roomName} className="absolute inset-0 h-full w-full object-cover" />
                {draft.items.map((item) => {
                  const product = liveProducts.find((entry) => entry.id === item.productId);
                  const material = materials.find((entry) => entry.id === item.materialId);
                  return <div key={item.id} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) scale(${item.scale * 0.8}) rotate(${item.rotation}deg)` }}><FurnitureToken image={product?.cardImage} name={product?.name} compact /></div>;
                })}
              </div>
            </div>
            <div className="mt-8 rounded-[1.6rem] bg-[#f6f1e7] p-5">
              {summaryItems.map((item) => <div key={`${item.productName}-${item.materialId}`} className="flex items-center justify-between py-2 font-dm text-sm text-tm-warm-gray"><span>{item.productName}</span><span>x{item.quantity}</span></div>)}
            </div>
          </div>
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              submitVisualiser({
                clientName: form.clientName,
                phone: form.phone,
                email: form.email,
                preferredDateTime: form.date && form.time ? `${form.date}T${form.time}:00.000Z` : undefined,
                notes: form.notes,
              });
              navigate('/book-consultation');
            }}
            className="rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_30px_90px_rgba(12,12,12,0.08)]"
          >
            <SectionIntro eyebrow="Handoff form" title="Book a consultation with this layout" body="The admin dashboard will receive the visualiser session, room image, and your details instantly." />
            <div className="mt-8 space-y-5">
              <InputField label="Full name" required value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} />
              <InputField label="Phone" required value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              <InputField label="Email" type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              <div className="grid gap-5 md:grid-cols-2">
                <InputField label="Preferred date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
                <SelectField label="Preferred time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}><option value="">No preference</option><option value="09:00">09:00</option><option value="11:00">11:00</option><option value="14:00">14:00</option><option value="16:00">16:00</option></SelectField>
              </div>
              <TextAreaField label="Notes" rows={5} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              <button type="submit" className="w-full rounded-full bg-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal">Send my visualiser layout</button>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full border border-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-gold"><Camera className="h-4 w-4" />Send on WhatsApp</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tm-obsidian pt-20 text-tm-cream sm:pt-28">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 pb-12 lg:flex-row lg:gap-8 lg:px-8">
        {/* Main Canvas Area */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-dm text-[10px] uppercase tracking-[0.3em] text-tm-gold">{draft.roomName}</p>
              <h1 className="mt-1 font-cormorant text-2xl tracking-tight text-tm-cream/90 lg:text-3xl">Room Visualiser</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Control icon={<ZoomOut className="h-4 w-4" />} onClick={() => setDraft({ zoom: Math.max(0.75, draft.zoom - 0.1) })} />
              <Control icon={<ZoomIn className="h-4 w-4" />} onClick={() => setDraft({ zoom: Math.min(1.5, draft.zoom + 0.1) })} />
              <div className="h-4 w-px bg-white/10 mx-1" />
              <Control icon={<Undo2 className="h-4 w-4" />} onClick={() => draft.items.at(-1)?.id && removeItem(draft.items.at(-1)!.id)} />
              <Control icon={<Grid3X3 className="h-4 w-4" />} onClick={() => setDraft({ gridEnabled: !draft.gridEnabled })} active={draft.gridEnabled} />
              <Control icon={<Eraser className="h-4 w-4" />} onClick={clearItems} />
              <Control icon={<Expand className="h-4 w-4" />} onClick={() => roomRef.current?.requestFullscreen()} />
            </div>
          </div>

          <div 
            ref={roomRef} 
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/5 bg-black/40 shadow-2xl sm:aspect-[16/10]"
            onClick={() => { setSelectedId(null); setContextMenu(null); }}
          >
            <div className="relative h-full w-full origin-center transition-transform duration-500 ease-out" style={{ transform: `scale(${draft.zoom})` }}>
              <img src={draft.roomPhotoUrl} alt={draft.roomName} className="absolute inset-0 h-full w-full object-cover opacity-90" />
              {draft.gridEnabled ? <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(184,147,90,0.08)_0,rgba(184,147,90,0.08)_1px,transparent_1px,transparent_40px),repeating-linear-gradient(90deg,rgba(184,147,90,0.06)_0,rgba(184,147,90,0.06)_1px,transparent_1px,transparent_40px)]" /> : null}
              {draft.items.map((item) => {
                const product = liveProducts.find((entry) => entry.id === item.productId);
                return (
                  <motion.div
                    key={item.id}
                    drag
                    dragMomentum={false}
                    onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}
                    onContextMenu={(event) => { event.preventDefault(); setSelectedId(item.id); setContextMenu({ x: event.clientX, y: event.clientY, itemId: item.id }); }}
                    onDragEnd={(event) => reposition(item.id, event as MouseEvent)}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{ left: `${item.x}%`, top: `${item.y}%`, zIndex: item.zIndex, transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)` }}
                  >
                    <FurnitureToken image={product?.cardImage} name={product?.name} selected={selectedId === item.id} />
                  </motion.div>
                );
              })}
            </div>

            {/* Selection HUD */}
            {selectedItem && selectedProduct ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-4 bottom-4 z-[80] lg:inset-x-auto lg:right-6 lg:top-6 lg:bottom-auto lg:w-80"
              >
                <div className="tm-glass-dark rounded-3xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="min-w-0">
                      <p className="truncate font-cormorant text-xl leading-none">{selectedProduct.name}</p>
                      <p className="mt-1 font-dm text-[10px] uppercase tracking-wider text-tm-gold">
                        {materials.find((item) => item.id === selectedItem.materialId)?.name}
                      </p>
                    </div>
                    <button onClick={() => setSelectedId(null)} className="rounded-full bg-white/5 p-2 text-tm-cream/60 hover:bg-white/10">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <Range label="Scale" min="0.55" max="1.5" step="0.05" value={selectedItem.scale} onChange={(value) => updateItem(selectedItem.id, { scale: Number(value) })} />
                    <Range label="Rotation" min="-30" max="30" step="1" value={selectedItem.rotation} onChange={(value) => updateItem(selectedItem.id, { rotation: Number(value) })} />
                    <button type="button" onClick={() => cycleMaterial(selectedItem.id)} className="flex w-full items-center justify-center rounded-xl bg-tm-gold/10 py-3 font-dm text-[11px] font-bold uppercase tracking-widest text-tm-gold transition-colors hover:bg-tm-gold/20">
                      Change material
                    </button>
                    <button type="button" onClick={() => removeItem(selectedItem.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-tm-error/10 py-3 font-dm text-[11px] font-bold uppercase tracking-widest text-tm-error transition-colors hover:bg-tm-error/20">
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Piece
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>

          <div className="tm-glass rounded-[2rem] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => save(false)} 
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 font-dm text-[11px] font-bold uppercase tracking-widest text-tm-cream hover:bg-white/10"
                >
                  Save Draft
                </button>
                <button 
                  onClick={() => save(true)} 
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 font-dm text-[11px] font-bold uppercase tracking-widest text-tm-cream hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
              <div className="flex items-center gap-4">
                {feedback ? <p className="font-dm text-xs text-tm-gold">{feedback}</p> : null}
                <Button to="/visualise/submit" variant="primary" icon={<Camera className="h-4 w-4" />} className="h-12 w-full sm:w-auto">
                  Submit Layout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <aside className="w-full shrink-0 space-y-4 lg:w-[320px] xl:w-[380px]">
          <div className="tm-glass-dark rounded-[2.5rem] p-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tm-gold/70" />
              <input 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
                placeholder="Search collection..." 
                className="w-full rounded-2xl bg-black/30 py-3.5 pl-11 pr-4 font-dm text-sm text-tm-cream placeholder:text-tm-cream/30 focus:outline-none focus:ring-1 focus:ring-tm-gold/40" 
              />
            </div>
            
            <div className="hide-scrollbar -mx-2 flex overflow-x-auto px-2 pb-4">
              <div className="flex gap-2">
                {categories.map((item) => (
                  <button 
                    key={item} 
                    onClick={() => setCategory(item)} 
                    className={cn(
                      "whitespace-nowrap rounded-full px-5 py-2.5 font-dm text-[10px] font-bold uppercase tracking-widest transition-all",
                      category === item ? "bg-tm-gold text-tm-obsidian" : "bg-white/5 text-tm-cream/60 hover:bg-white/10"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <span className="font-dm text-[9px] uppercase tracking-[0.2em] text-tm-cream/40">Finish</span>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button 
                  onClick={() => setMaterialFilter('all')} 
                  className={cn(
                    "rounded-full px-3 py-1 font-dm text-[9px] font-bold uppercase tracking-wider",
                    materialFilter === 'all' ? "bg-tm-gold/20 text-tm-gold" : "text-tm-cream/40 hover:text-tm-cream"
                  )}
                >
                  All
                </button>
                {materials.map((m) => (
                  <button key={m.id} onClick={() => setMaterialFilter(m.id)} className={cn("h-4 w-4 rounded-full border border-white/10 transition-transform active:scale-90", materialFilter === m.id ? "ring-2 ring-tm-gold" : "")} style={{ backgroundColor: m.tone }} />
                ))}
              </div>
            </div>

            <div className="hide-scrollbar mt-6 h-[50svh] space-y-4 overflow-y-auto pr-1 lg:h-[62svh]">
              {filtered.map((product) => (
                <div key={product.id} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/20">
                      <img src={product.cardImage} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-dm text-[9px] uppercase tracking-widest text-tm-gold">{product.category}</p>
                      <h3 className="mt-1 truncate font-cormorant text-xl leading-none">{product.name}</h3>
                      <button 
                        onClick={() => autoPlace(product)} 
                        disabled={loadingAI !== null} 
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-tm-gold py-2.5 font-dm text-[10px] font-bold uppercase tracking-widest text-tm-obsidian transition-transform active:scale-[0.97]"
                      >
                        {loadingAI === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Place in room'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => { resetDraft(); navigate('/visualise'); }} className="mt-6 flex w-full items-center justify-center gap-2 py-2 font-dm text-[11px] font-medium uppercase tracking-widest text-tm-cream/40 hover:text-tm-gold">
              <RotateCcw className="h-3 w-3" />
              Reset Room
            </button>
          </div>
        </aside>
      </div>

      {contextMenu ? (
        <div className="fixed z-[120] w-48 overflow-hidden rounded-2xl tm-glass-dark border border-white/10 p-1 shadow-2xl" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <MenuButton label="Bring Forward" onClick={() => { updateItem(contextMenu.itemId, { zIndex: Math.max(...draft.items.map((i) => i.zIndex)) + 1 }); setContextMenu(null); }} />
          <MenuButton label="Change Finish" onClick={() => { cycleMaterial(contextMenu.itemId); setContextMenu(null); }} />
          <MenuButton label="Remove" onClick={() => { removeItem(contextMenu.itemId); setContextMenu(null); }} />
        </div>
      ) : null}
    </div>
  );
}

function Control({ icon, onClick, active = false }: { icon: ReactNode; onClick: () => void; active?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex h-11 w-11 items-center justify-center rounded-full border ${active ? 'border-tm-gold bg-tm-gold text-tm-charcoal' : 'border-white/10 bg-white/5 text-tm-cream/78'}`}>{icon}</button>;
}
function Action({ label, onClick, icon, primary = false }: { label: string; onClick: () => void; icon?: ReactNode; primary?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.22em] ${primary ? 'bg-tm-gold text-tm-charcoal' : 'border border-white/10 text-tm-cream/76'}`}>{icon}{label}</button>;
}
function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="block w-full rounded-[0.9rem] px-4 py-3 text-left font-dm text-sm text-tm-cream/82 transition hover:bg-white/6">{label}</button>;
}
function Range({ label, ...props }: { label: string; min: string; max: string; step: string; value: number; onChange: (value: string) => void }) {
  return <label className="font-dm text-xs uppercase tracking-[0.22em] text-tm-cream/56">{label}<input type="range" className="mt-2 w-full" {...props} onChange={(event) => props.onChange(event.target.value)} /></label>;
}
function FurnitureToken({ image, name, selected = false, compact = false }: { image?: string; name?: string; selected?: boolean; compact?: boolean }) {
  if (compact) {
    return (
      <div className="relative w-16 h-16 overflow-hidden rounded-xl">
        {image ? (
          <img src={image} alt={name || 'Furniture'} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-tm-warm-gray/30" />
        )}
      </div>
    );
  }
  return (
    <div
      className={`relative transition-shadow duration-200 ${selected ? 'ring-[3px] ring-tm-gold ring-offset-2 ring-offset-transparent rounded-2xl' : ''}`}
      style={{ filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.45)) drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}
    >
      <div className="w-28 md:w-36 overflow-hidden rounded-2xl">
        {image ? (
          <img src={image} alt={name || 'Furniture'} className="h-24 md:h-28 w-full object-cover" draggable={false} />
        ) : (
          <div className="h-24 md:h-28 w-full bg-tm-warm-gray/30" />
        )}
      </div>
      {name && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 backdrop-blur-md px-3 py-1 font-dm text-[0.6rem] uppercase tracking-[0.14em] text-tm-cream/90 shadow-lg">
          {name}
        </div>
      )}
    </div>
  );
}
