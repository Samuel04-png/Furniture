import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DimensionDiagram, PageHero, SectionIntro, StatusBadge } from '../components/primitives';
import { formatCurrency } from '../lib/utils';
import { useTailoredStore } from '../store/useTailoredStore';

export default function ProductDetail() {
  const { slug } = useParams();
  const products = useTailoredStore((state) => state.products);
  const materials = useTailoredStore((state) => state.materials);
  const product = products.find((item) => item.slug === slug);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(product?.materials[0] ?? 'mukwa');
  const [selectedFinish, setSelectedFinish] = useState(product?.finishes[0] ?? 'Matt');
  const [selectedPreset, setSelectedPreset] = useState(product?.sizePresets[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);

  const relatedProducts = useMemo(
    () =>
      products
        .filter((item) => item.slug !== slug && item.room === product?.room && item.status === 'Live')
        .slice(0, 3),
    [product?.room, products, slug],
  );

  if (!product) {
    return <Navigate to="/collections" replace />;
  }

  const selectedMaterialData = materials.find((material) => material.id === selectedMaterial) ?? materials[0];
  const selectedSize = product.sizePresets.find((size) => size.id === selectedPreset) ?? product.sizePresets[0];
  const visualiserHref = `/visualise?product=${product.id}&material=${selectedMaterial}`;
  const configuratorHref = `/configure?product=${product.id}&material=${selectedMaterial}&finish=${encodeURIComponent(selectedFinish)}`;

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow={product.category}
        title={product.name}
        body={product.summary}
        image={product.gallery[activeImage] || product.heroImage}
        heightClassName="min-h-[72svh]"
      />

      <div className="border-b border-black/6 bg-white/70 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto">
          {product.gallery.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`h-28 min-w-[9rem] overflow-hidden rounded-[1.4rem] border transition ${
                activeImage === index ? 'border-tm-gold shadow-[0_0_0_2px_rgba(184,147,90,0.18)]' : 'border-black/8'
              }`}
            >
              <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <StatusBadge tone="gold">{product.room}</StatusBadge>
            <h1 className="mt-6 font-cormorant text-[clamp(2.8rem,5vw,4.5rem)] leading-[0.96] tracking-[-0.04em] text-tm-obsidian">
              {product.name}
            </h1>
            <p className="mt-6 max-w-4xl font-cormorant text-[clamp(1.5rem,3vw,2rem)] italic leading-[1.35] text-tm-warm-gray">
              {product.story}
            </p>
            <p className="mt-8 max-w-3xl font-dm text-[1rem] leading-8 text-tm-warm-gray">{product.description}</p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to={`/materials/${selectedMaterialData.id}`}
                className="inline-flex items-center gap-3 rounded-full border border-black/8 bg-white px-4 py-3"
              >
                <span className="h-10 w-10 overflow-hidden rounded-full border border-black/8">
                  <img src={selectedMaterialData.grainImage} alt={selectedMaterialData.name} className="h-full w-full object-cover" />
                </span>
                <div className="text-left">
                  <p className="font-dm text-[0.68rem] uppercase tracking-[0.24em] text-tm-warm-gray">Material</p>
                  <p className="font-dm text-sm font-medium text-tm-obsidian">{selectedMaterialData.name}</p>
                </div>
              </Link>
              <StatusBadge>{product.leadTime} lead time</StatusBadge>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
              <DimensionDiagram dimensions={selectedSize.dimensions} label="Dimension sketch" />
              <div className="rounded-[1.8rem] border border-black/8 bg-white p-6">
                <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Typical use</p>
                <ul className="mt-5 space-y-4 font-dm text-sm leading-7 text-tm-warm-gray">
                  <li>• Best for {product.tags.join(', ')}</li>
                  <li>• Configured in {product.materials.length} hardwood options</li>
                  <li>• Finish library matched to your room palette</li>
                  <li>• Delivered and installed by the Tailored Manor team</li>
                </ul>
              </div>
            </div>

            <div className="mt-16">
              <SectionIntro
                eyebrow="How this is made"
                title="Craft details that matter in person"
                body="Every category has its own build logic, but the same principle applies: refined joinery, tactile finishing, and proportion confirmed to your room."
              />
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {product.processGallery.map((item) => (
                  <div key={item.title} className="overflow-hidden rounded-[2rem] border border-black/6 bg-white">
                    <img src={item.image} alt={item.title} className="h-56 w-full object-cover" />
                    <div className="p-5">
                      <h3 className="font-cormorant text-[1.8rem] leading-none tracking-[-0.03em] text-tm-obsidian">{item.title}</h3>
                      <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_30px_90px_rgba(12,12,12,0.09)]">
              <h2 className="font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Configure Your Piece</h2>
              <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">
                Start with a finish direction here, then continue into the full configurator for dimensions, notes, and room details.
              </p>

              <div className="mt-8">
                <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Material</p>
                <div className="flex flex-wrap gap-3">
                  {product.materials.map((materialId) => {
                    const material = materials.find((item) => item.id === materialId)!;
                    return (
                      <button
                        key={materialId}
                        type="button"
                        onClick={() => setSelectedMaterial(materialId)}
                        className={`rounded-full border p-1 transition ${selectedMaterial === materialId ? 'border-tm-gold' : 'border-black/10'}`}
                      >
                        <img src={material.grainImage} alt={material.name} className="h-11 w-11 rounded-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8">
                <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Finish</p>
                <div className="grid grid-cols-3 gap-2">
                  {product.finishes.map((finish) => (
                    <button
                      key={finish}
                      type="button"
                      onClick={() => setSelectedFinish(finish)}
                      className={`rounded-[1rem] border px-3 py-3 font-dm text-[0.72rem] uppercase tracking-[0.18em] transition ${
                        selectedFinish === finish
                          ? 'border-tm-gold bg-tm-gold/10 text-tm-obsidian'
                          : 'border-black/8 text-tm-warm-gray'
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>

              {product.upholsterySwatches?.length ? (
                <div className="mt-8">
                  <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Upholstery</p>
                  <div className="grid grid-cols-3 gap-3">
                    {product.upholsterySwatches.slice(0, 6).map((swatch) => (
                      <div key={swatch.id} className="rounded-[1rem] border border-black/8 p-3">
                        <div className="h-10 w-full rounded-full" style={{ backgroundColor: swatch.color }} />
                        <p className="mt-3 font-dm text-[0.7rem] uppercase tracking-[0.18em] text-tm-obsidian">{swatch.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8">
                <p className="mb-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Size</p>
                <div className="space-y-2">
                  {product.sizePresets.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedPreset(size.id)}
                      className={`flex w-full items-center justify-between rounded-[1rem] border px-4 py-3 text-left transition ${
                        selectedPreset === size.id
                          ? 'border-tm-gold bg-tm-gold/10'
                          : 'border-black/8 text-tm-warm-gray'
                      }`}
                    >
                      <span className="font-dm text-sm font-medium text-tm-obsidian">{size.label}</span>
                      <span className="font-dm text-xs uppercase tracking-[0.18em] text-tm-warm-gray">
                        {size.dimensions.width} x {size.dimensions.depth} x {size.dimensions.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between rounded-[1.2rem] border border-black/8 px-4 py-3">
                <span className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="h-9 w-9 rounded-full border border-black/10"
                  >
                    -
                  </button>
                  <span className="min-w-[1.2rem] text-center font-dm text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                    className="h-9 w-9 rounded-full border border-black/10"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-8 rounded-[1.6rem] bg-[#f6f1e7] p-5">
                <p className="font-dm text-[0.68rem] uppercase tracking-[0.22em] text-tm-warm-gray">Price</p>
                <p className="mt-3 font-cormorant text-[2.2rem] leading-none tracking-[-0.04em] text-tm-obsidian">
                  {formatCurrency(product.priceFrom * quantity)}
                </p>
                <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">From price shown here. Final price is confirmed after consultation once dimensions and finishes are locked.</p>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  to={visualiserHref}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal transition hover:bg-tm-gold-light"
                >
                  Visualise in My Room
                </Link>
                <Link
                  to={configuratorHref}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-tm-gold px-6 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-gold transition hover:bg-tm-gold hover:text-tm-charcoal"
                >
                  Request a Quote
                </Link>
              </div>

              <p className="mt-5 font-dm text-center text-sm text-tm-warm-gray">Typically {product.leadTime} from order confirmation</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-black/6 bg-[#f5ede2] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Related pieces"
            title="Build the room as a full composition"
            body="These pieces share the same room category and material language."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <Link key={item.id} to={`/collections/${item.slug}`} className="overflow-hidden rounded-[2rem] border border-black/8 bg-white">
                <img src={item.cardImage} alt={item.name} className="h-72 w-full object-cover" />
                <div className="p-6">
                  <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{item.category}</p>
                  <h3 className="mt-3 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{item.name}</h3>
                  <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">{item.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-obsidian">
                    Explore piece
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
