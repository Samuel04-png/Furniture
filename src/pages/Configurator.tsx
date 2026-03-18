import { useEffect, useMemo, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import { DimensionDiagram, InputField, PageHero, SectionIntro, SelectField, TextAreaField } from '../components/primitives';
import { asset } from '../data/content';
import Image from '../components/Image';

import { formatCurrency, prepareRoomImage } from '../lib/utils';
import { useTailoredStore } from '../store/useTailoredStore';

const steps = [
  { id: 1, path: '/configure', label: 'Piece' },
  { id: 2, path: '/configure/step-2', label: 'Material' },
  { id: 3, path: '/configure/step-3', label: 'Dimensions' },
  { id: 4, path: '/configure/step-4', label: 'Review' },
];

export default function Configurator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const products = useTailoredStore((state) => state.products);
  const materials = useTailoredStore((state) => state.materials);
  const draft = useTailoredStore((state) => state.configuratorDraft);
  const setDraft = useTailoredStore((state) => state.setConfiguratorDraft);
  const resetDraft = useTailoredStore((state) => state.resetConfiguratorDraft);
  const createQuoteRequest = useTailoredStore((state) => state.createQuoteRequest);
  const liveProducts = useMemo(() => products.filter((product) => product.status === 'Live'), [products]);
  const currentStep =
    location.pathname.endsWith('/step-4') ? 4 : location.pathname.endsWith('/step-3') ? 3 : location.pathname.endsWith('/step-2') ? 2 : location.pathname.endsWith('/confirmation') ? 5 : 1;
  const selectedProduct = liveProducts.find((item) => item.id === draft.productId);
  const selectedMaterial = materials.find((item) => item.id === draft.materialId);

  useEffect(() => {
    const productId = params.get('product');
    const materialId = params.get('material');
    const finish = params.get('finish');
    if (productId && !draft.productId) {
      const product = liveProducts.find((item) => item.id === productId);
      if (product) {
        setDraft({
          productId: product.id,
          dimensions: product.sizePresets[0].dimensions,
          sizePresetId: product.sizePresets[0].id,
          materialId: materialId && product.materials.includes(materialId) ? materialId : product.materials[0],
          finish: finish && product.finishes.includes(finish) ? finish : product.finishes[0],
        });
      }
    } else if (materialId && !draft.materialId) {
      setDraft({ materialId });
    }
  }, [draft.materialId, draft.productId, liveProducts, params, setDraft]);

  const estimatedPrice = (() => {
    if (!selectedProduct && !draft.isCustomDesign) return 0;
    const base = selectedProduct?.priceFrom ?? 60000;
    const materialMultiplier =
      draft.materialId === 'rosewood' ? 1.18 : draft.materialId === 'mahogany' ? 1.12 : draft.materialId === 'teak' ? 1.08 : 1;
    const volumeFactor =
      draft.dimensionMode === 'custom'
        ? Math.max(0.85, Math.min(1.9, (draft.dimensions.width * draft.dimensions.depth * draft.dimensions.height) / (220 * 100 * 76)))
        : 1;
    return Math.round(base * materialMultiplier * volumeFactor * draft.quantity);
  })();

  const next = () => {
    const nextStep = steps.find((step) => step.id === currentStep + 1);
    if (nextStep) navigate(nextStep.path);
  };

  const back = () => {
    const previous = steps.find((step) => step.id === currentStep - 1);
    if (previous) navigate(previous.path);
  };

  const uploadImage = async (file: File, field: 'customDesignImage' | 'uploadedSpacePhoto') => {
    const prepared = await prepareRoomImage(file);
    setDraft({ [field]: prepared.dataUrl } as never);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createQuoteRequest();
    navigate('/configure/confirmation');
  };

  if (currentStep === 5) {
    return (
      <div className="bg-tm-off-white">
        <PageHero
          eyebrow="Quote request sent"
          title="We have received your request."
          body="One of the team will be in touch within 24 hours to confirm dimensions, finish direction, and final pricing."
          image={asset('ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (1).jpg')}
          heightClassName="min-h-[52svh]"

        >
          <div className="flex flex-wrap gap-4">
            <Link to="/collections" className="rounded-full bg-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal">
              Back to collection
            </Link>
            <Link to="/visualise" className="rounded-full border border-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-gold">
              Visualise a room
            </Link>
          </div>
        </PageHero>
      </div>
    );
  }

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Custom quote system"
        title="A guided configuration experience"
        body="This flow mirrors a luxury retail consultation, not a generic checkout. Every selection lands directly in the admin CRM."
        image={asset('ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (2).jpg')}
        heightClassName="min-h-[48svh]"

      />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <StepHeader currentStep={currentStep} />
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.42fr]">
            <div className="rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_30px_90px_rgba(12,12,12,0.07)] md:p-10">
              {currentStep === 1 ? (
                <div>
                  <SectionIntro eyebrow="Step 1" title="Which piece would you like made for you?" body="Choose from the catalogue or start from your own design reference." />
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {liveProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setDraft({ productId: product.id, isCustomDesign: false, customDesignImage: null, dimensions: product.sizePresets[0].dimensions, sizePresetId: product.sizePresets[0].id, materialId: product.materials[0], finish: product.finishes[0] })}
                        className={`overflow-hidden rounded-[1.8rem] border text-left transition ${draft.productId === product.id ? 'border-tm-gold shadow-[0_0_0_2px_rgba(184,147,90,0.18)]' : 'border-black/8'}`}
                      >
                        <Image src={product.cardImage} alt={product.name} className="h-56" />
                        <div className="p-5">

                          <p className="font-dm text-[0.68rem] uppercase tracking-[0.24em] text-tm-gold">{product.category}</p>
                          <h3 className="mt-3 font-cormorant text-[1.9rem] leading-none tracking-[-0.03em] text-tm-obsidian">{product.name}</h3>
                        </div>
                      </button>
                    ))}
                    <label className={`flex min-h-[20rem] cursor-pointer flex-col items-center justify-center rounded-[1.8rem] border border-dashed p-8 text-center ${draft.isCustomDesign ? 'border-tm-gold bg-[#f6f1e7]' : 'border-black/12'}`}>
                      <Upload className="h-8 w-8 text-tm-gold" />
                      <h3 className="mt-5 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">I have my own design</h3>
                      <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">Upload a sketch or reference photo to start from scratch.</p>
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], 'customDesignImage')} />
                    </label>
                  </div>
                  {draft.customDesignImage ? (
                    <div className="mt-6 rounded-[1.6rem] border border-black/8 bg-[#f6f1e7] p-5">
                      <Image src={draft.customDesignImage} alt="Custom design" className="h-56" />
                      <TextAreaField label="Describe your vision" rows={4} value={draft.customDesignNotes} onChange={(event) => setDraft({ isCustomDesign: true, customDesignNotes: event.target.value, productId: undefined })} className="mt-4" />
                    </div>

                  ) : null}
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div>
                  <SectionIntro eyebrow="Step 2" title="Choose your material and finish" body="Material cards use the actual timber tone and carry through to the live preview in the summary." />
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {materials.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => setDraft({ materialId: material.id })}
                        className={`overflow-hidden rounded-[1.8rem] border text-left transition ${draft.materialId === material.id ? 'border-tm-gold shadow-[0_0_0_2px_rgba(184,147,90,0.18)]' : 'border-black/8'}`}
                      >
                        <Image src={material.grainImage} alt={material.name} className="h-44" />
                        <div className="p-5">

                          <h3 className="font-cormorant text-[1.9rem] leading-none tracking-[-0.03em] text-tm-obsidian">{material.name}</h3>
                          <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">{material.character}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-8">
                    <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Finish</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {(selectedProduct?.finishes ?? ['Matt', 'Medium Gloss', 'High Gloss']).map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          onClick={() => setDraft({ finish })}
                          className={`rounded-[1.2rem] border px-4 py-5 font-dm text-[0.72rem] uppercase tracking-[0.18em] transition ${draft.finish === finish ? 'border-tm-gold bg-[#f6f1e7]' : 'border-black/8 text-tm-warm-gray'}`}
                        >
                          {finish}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedProduct?.upholsterySwatches?.length ? (
                    <div className="mt-8">
                      <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Upholstery</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        {selectedProduct.upholsterySwatches.map((swatch) => (
                          <button key={swatch.id} type="button" onClick={() => setDraft({ upholsteryId: swatch.id })} className={`rounded-[1rem] border p-3 text-left ${draft.upholsteryId === swatch.id ? 'border-tm-gold' : 'border-black/8'}`}>
                            <div className="h-10 rounded-full" style={{ backgroundColor: swatch.color }} />
                            <p className="mt-3 font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-obsidian">{swatch.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <TextAreaField label="Material or finish notes" rows={4} value={draft.notes} onChange={(event) => setDraft({ notes: event.target.value })} className="mt-8" />
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div>
                  <SectionIntro eyebrow="Step 3" title="Set your dimensions" body="Choose a standard size or switch to a custom brief with room-scale context." />
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <button type="button" onClick={() => selectedProduct && setDraft({ dimensionMode: 'standard', sizePresetId: selectedProduct.sizePresets[0].id, dimensions: selectedProduct.sizePresets[0].dimensions })} className={`rounded-[1.8rem] border p-6 text-left ${draft.dimensionMode === 'standard' ? 'border-tm-gold bg-[#f6f1e7]' : 'border-black/8'}`}>
                      <h3 className="font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Standard dimensions</h3>
                      <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">Use a pre-set size profile and adjust only if the room needs it.</p>
                      {selectedProduct ? <div className="mt-4 space-y-2">{selectedProduct.sizePresets.map((size) => <button key={size.id} type="button" onClick={() => setDraft({ dimensionMode: 'standard', sizePresetId: size.id, dimensions: size.dimensions })} className={`flex w-full items-center justify-between rounded-[1rem] border px-4 py-3 ${draft.sizePresetId === size.id ? 'border-tm-gold bg-white' : 'border-black/8'}`}><span className="font-dm text-sm">{size.label}</span><span className="font-dm text-xs uppercase tracking-[0.16em] text-tm-warm-gray">{size.dimensions.width} x {size.dimensions.depth} x {size.dimensions.height}</span></button>)}</div> : null}
                    </button>
                    <div className={`rounded-[1.8rem] border p-6 ${draft.dimensionMode === 'custom' ? 'border-tm-gold bg-[#f6f1e7]' : 'border-black/8'}`}>
                      <button type="button" onClick={() => setDraft({ dimensionMode: 'custom' })} className="text-left">
                        <h3 className="font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Custom dimensions</h3>
                        <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">Tailor the piece to your room. Gentle warnings appear if proportions look unusual.</p>
                      </button>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <InputField label="Width (cm)" type="number" value={String(draft.dimensions.width)} onChange={(event) => setDraft({ dimensionMode: 'custom', dimensions: { ...draft.dimensions, width: Number(event.target.value) } })} />
                        <InputField label="Depth (cm)" type="number" value={String(draft.dimensions.depth)} onChange={(event) => setDraft({ dimensionMode: 'custom', dimensions: { ...draft.dimensions, depth: Number(event.target.value) } })} />
                        <InputField label="Height (cm)" type="number" value={String(draft.dimensions.height)} onChange={(event) => setDraft({ dimensionMode: 'custom', dimensions: { ...draft.dimensions, height: Number(event.target.value) } })} className="md:col-span-2" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
                    <DimensionDiagram dimensions={draft.dimensions} label="Live dimension sketch" />
                    <div className="rounded-[1.8rem] border border-black/8 bg-white p-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <InputField label="Room width (cm)" type="number" value={draft.roomDimensions?.width ? String(draft.roomDimensions.width) : ''} onChange={(event) => setDraft({ roomDimensions: { width: Number(event.target.value), length: draft.roomDimensions?.length ?? 0 } })} />
                        <InputField label="Room length (cm)" type="number" value={draft.roomDimensions?.length ? String(draft.roomDimensions.length) : ''} onChange={(event) => setDraft({ roomDimensions: { width: draft.roomDimensions?.width ?? 0, length: Number(event.target.value) } })} />
                        <InputField label="Quantity" type="number" min="1" value={String(draft.quantity)} onChange={(event) => setDraft({ quantity: Math.max(1, Number(event.target.value)) })} className="md:col-span-2" />
                      </div>
                      {draft.dimensions.height < 60 ? <p className="mt-4 rounded-[1rem] border border-tm-gold/30 bg-tm-gold/10 px-4 py-3 font-dm text-sm text-tm-warm-gray">This height is unusually low for most furniture categories. The team will confirm feasibility during consultation.</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <form onSubmit={submit}>
                  <SectionIntro eyebrow="Step 4" title="Review and submit quote request" body="This summary and your files will appear in the admin CRM immediately after submission." />
                  <div className="mt-8 rounded-[1.8rem] border border-black/8 bg-[#f6f1e7] p-6">
                    <p className="font-cormorant text-[2.2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{selectedProduct?.name || 'Bespoke Custom Design'}</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <SummaryItem label="Material" value={selectedMaterial?.name || 'Not selected'} />
                      <SummaryItem label="Finish" value={draft.finish || 'Not selected'} />
                      <SummaryItem label="Dimensions" value={`${draft.dimensions.width} x ${draft.dimensions.depth} x ${draft.dimensions.height} cm`} />
                      <SummaryItem label="Quantity" value={String(draft.quantity)} />
                    </div>
                    <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">Indicative price</p>
                        <p className="mt-2 font-cormorant text-[2.6rem] leading-none tracking-[-0.04em] text-tm-obsidian">{formatCurrency(estimatedPrice)}</p>
                        <p className="mt-2 font-dm text-sm text-tm-warm-gray">Final price confirmed after consultation</p>
                      </div>
                      <p className="font-dm text-sm text-tm-warm-gray">Lead time: {selectedProduct?.leadTime || '6-8 weeks'}</p>
                    </div>
                  </div>
                  <div className="mt-8 space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField label="Full name" required value={draft.clientName} onChange={(event) => setDraft({ clientName: event.target.value })} />
                      <InputField label="Phone (WhatsApp preferred)" required value={draft.phone} onChange={(event) => setDraft({ phone: event.target.value })} />
                    </div>
                    <InputField label="Email" type="email" required value={draft.email} onChange={(event) => setDraft({ email: event.target.value })} />
                    <InputField label="Preferred contact time" value={draft.preferredContactTime} onChange={(event) => setDraft({ preferredContactTime: event.target.value })} />
                    <TextAreaField label="Anything else we should know?" rows={5} value={draft.notes} onChange={(event) => setDraft({ notes: event.target.value })} />
                    <label className="block rounded-[1.4rem] border border-dashed border-black/12 p-6 text-center font-dm text-sm text-tm-warm-gray">
                      Optional: upload a photo of your space
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0], 'uploadedSpacePhoto')} />
                    </label>
                    <button type="submit" className="w-full rounded-full bg-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal">
                      Send my quote request
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-10 flex items-center justify-between border-t border-black/8 pt-6">
                <button type="button" onClick={back} className={`inline-flex items-center gap-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] ${currentStep === 1 ? 'pointer-events-none opacity-0' : 'text-tm-warm-gray'}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={
                    (currentStep === 1 && !draft.productId && !draft.customDesignImage) ||
                    (currentStep === 2 && !draft.materialId) ||
                    (currentStep === 3 && !draft.dimensions.width)
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-tm-obsidian px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_30px_90px_rgba(12,12,12,0.07)]">
                <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Your configuration</p>
                <div className="mt-5 overflow-hidden rounded-[1.6rem] bg-[#f6f1e7] p-4">
                  {selectedProduct ? <Image src={selectedProduct.cardImage} alt={selectedProduct.name} className="h-56" /> : draft.customDesignImage ? <Image src={draft.customDesignImage} alt="Custom design" className="h-56" /> : <div className="flex h-56 items-center justify-center rounded-[1.4rem] border border-dashed border-black/10 font-dm text-sm text-tm-warm-gray">No piece selected yet</div>}
                  <h3 className="mt-5 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{selectedProduct?.name || (draft.customDesignImage ? 'Bespoke Custom Design' : 'Select a piece')}</h3>
                </div>

                <div className="mt-6 space-y-4 font-dm text-sm text-tm-warm-gray">
                  <div className="flex items-center justify-between"><span>Material</span><span>{selectedMaterial?.name || '-'}</span></div>
                  <div className="flex items-center justify-between"><span>Finish</span><span>{draft.finish || '-'}</span></div>
                  <div className="flex items-center justify-between"><span>Dimensions</span><span>{draft.dimensions.width} x {draft.dimensions.depth} x {draft.dimensions.height}</span></div>
                  <div className="flex items-center justify-between"><span>Quantity</span><span>{draft.quantity}</span></div>
                </div>
                <div className="mt-6 rounded-[1.6rem] bg-tm-obsidian p-5 text-tm-cream">
                  <p className="font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-cream/56">Estimated price</p>
                  <p className="mt-3 font-cormorant text-[2.4rem] leading-none tracking-[-0.04em]">{estimatedPrice ? formatCurrency(estimatedPrice) : 'TBD'}</p>
                </div>
                <button type="button" onClick={resetDraft} className="mt-6 w-full rounded-full border border-black/10 px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Reset configuration</button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepHeader({ currentStep }: { currentStep: number }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black/10" />
        <div className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-tm-gold transition-all duration-500" style={{ width: `${((currentStep - 1) / 4) * 100}%` }} />
        {steps.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${currentStep >= step.id ? 'border-tm-gold bg-tm-gold text-tm-charcoal' : 'border-black/10 bg-tm-off-white text-tm-warm-gray'}`}>
              {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
            </div>
            <span className="font-dm text-[0.68rem] uppercase tracking-[0.22em] text-tm-warm-gray">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-dm text-[0.68rem] uppercase tracking-[0.18em] text-tm-warm-gray">{label}</p>
      <p className="mt-2 font-dm text-sm text-tm-obsidian">{value}</p>
    </div>
  );
}
