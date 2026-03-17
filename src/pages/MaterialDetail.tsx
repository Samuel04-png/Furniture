import { useMemo } from 'react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHero, SectionIntro } from '../components/primitives';
import { useTailoredStore } from '../store/useTailoredStore';

export default function MaterialDetail() {
  const { slug } = useParams();
  const materials = useTailoredStore((state) => state.materials);
  const products = useTailoredStore((state) => state.products);
  const material = materials.find((item) => item.id === slug);
  const liveProducts = useMemo(() => products.filter((product) => product.status === 'Live'), [products]);

  if (!material) {
    return <Navigate to="/materials" replace />;
  }

  const relatedProducts = liveProducts.filter((product) => product.materials.includes(material.id)).slice(0, 4);

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow={material.origin}
        title={material.name}
        body={material.character}
        image={material.grainImage}
        heightClassName="min-h-[60svh]"
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionIntro
              eyebrow="Material profile"
              title="A timber chosen for rooms that want warmth and permanence"
              body={material.description}
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.8rem] border border-black/8 bg-white p-6">
                <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Visual character</p>
                <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">{material.character}</p>
              </div>
              <div className="rounded-[1.8rem] border border-black/8 bg-white p-6">
                <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Available finishes</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {material.availableFinishes.map((finish) => (
                    <span key={finish} className="rounded-full border border-black/8 px-4 py-2 font-dm text-[0.72rem] uppercase tracking-[0.18em] text-tm-obsidian">
                      {finish}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_30px_90px_rgba(12,12,12,0.08)]">
            <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-warm-gray">Best for</p>
            <ul className="mt-5 space-y-3 font-dm text-sm leading-7 text-tm-warm-gray">
              {material.bestFor.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <div className="mt-8 rounded-[1.6rem] p-5" style={{ background: `linear-gradient(135deg, ${material.tone}, ${material.accentTone})` }}>
              <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-white/72">Tone board</p>
              <p className="mt-3 font-cormorant text-4xl tracking-[-0.04em] text-white">{material.name}</p>
            </div>
            <Link
              to={`/configure?material=${material.id}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-tm-obsidian px-5 py-3 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-cream"
            >
              Start a custom quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-black/6 bg-[#f5ede2] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Applied pieces"
            title={`See ${material.name} used across the collection`}
            body="These products currently support this material, and changes in the admin will be reflected here immediately."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((product) => (
              <Link key={product.id} to={`/collections/${product.slug}`} className="overflow-hidden rounded-[2rem] border border-black/8 bg-white">
                <img src={product.cardImage} alt={product.name} className="h-72 w-full object-cover" />
                <div className="p-5">
                  <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{product.category}</p>
                  <h3 className="mt-3 font-cormorant text-[1.9rem] leading-none tracking-[-0.03em] text-tm-obsidian">{product.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
