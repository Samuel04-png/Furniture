import { useMemo } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHero, ProductCard, SectionIntro } from '../components/primitives';
import { useTailoredStore } from '../store/useTailoredStore';
import { asset } from '../data/content';


const roomOptions = ['Living', 'Dining', 'Bedroom', 'Office', 'Outdoor'] as const;
const materialOptions = ['mukwa', 'rosewood', 'teak', 'mahogany'] as const;
const styleOptions = ['Contemporary', 'Traditional', 'Organic', 'Minimalist'] as const;

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useTailoredStore((state) => state.products);

  const filters = {
    query: searchParams.get('q') || '',
    room: searchParams.get('room') || 'All',
    material: searchParams.get('material') || 'All',
    style: searchParams.get('style') || 'All',
    customOnly: searchParams.get('customOnly') === 'true',
  };

  const liveProducts = useMemo(() => products.filter((product) => product.status === 'Live'), [products]);

  const filteredProducts = useMemo(
    () =>
      liveProducts.filter((product) => {
        const query = filters.query.trim().toLowerCase();
        const matchesQuery =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.room.toLowerCase().includes(query) ||
          product.style.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesRoom = filters.room === 'All' || product.room === filters.room;
        const matchesMaterial = filters.material === 'All' || product.materials.includes(filters.material);
        const matchesStyle = filters.style === 'All' || product.style === filters.style;
        const matchesCustom = !filters.customOnly || product.customDimensions;
        return matchesQuery && matchesRoom && matchesMaterial && matchesStyle && matchesCustom;
      }),
    [filters, liveProducts],
  );

  const updateFilter = (key: 'query' | 'room' | 'material' | 'style' | 'customOnly', value: string | boolean) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'query') {
      if (!String(value).trim()) next.delete('q');
      else next.set('q', String(value));
      setSearchParams(next);
      return;
    }
    if (key === 'customOnly') {
      if (value) next.set(key, 'true');
      else next.delete(key);
      setSearchParams(next);
      return;
    }
    if (value === 'All') next.delete(key);
    else next.set(key, String(value));
    setSearchParams(next);
  };

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Curated catalogue"
        title="The Collection"
        body="Designed like an editorial selection rather than a retail grid. Filter by room, material, mood, or use case to find a starting point."
        image={asset('Sleek black leather sofas/Sleek black leather sofas paired in a setup that feels modern, cozy, and beautifully put togethe (1).jpg')}
        heightClassName="min-h-[62svh]"

      />

      <div className="z-40 border-b border-black/6 bg-[rgba(250,247,244,0.92)] px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tm-warm-gray" />
              <input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                placeholder="Search pieces..."
                className="w-full border border-black/10 bg-tm-off-white py-2.5 pl-11 pr-4 font-dm text-sm text-tm-obsidian outline-none transition focus:border-tm-gold lg:py-3"
              />
            </label>
            <button
              type="button"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="inline-flex h-10 items-center justify-center gap-2 border border-black/10 bg-tm-off-white px-4 font-dm text-[0.7rem] uppercase tracking-[0.22em] text-tm-warm-gray transition hover:border-tm-gold hover:text-tm-obsidian lg:h-11"
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <FilterGroup
              label="Room"
              options={['All', ...roomOptions]}
              active={filters.room}
              onChange={(value) => updateFilter('room', value)}
            />
            <FilterGroup
              label="Material"
              options={['All', ...materialOptions]}
              active={filters.material}
              onChange={(value) => updateFilter('material', value)}
              capitalize
            />
            <FilterGroup
              label="Style"
              options={['All', ...styleOptions]}
              active={filters.style}
              onChange={(value) => updateFilter('style', value)}
            />
            <button
              type="button"
              onClick={() => updateFilter('customOnly', !filters.customOnly)}
              className={`h-10 border px-4 font-dm text-[0.7rem] uppercase tracking-[0.22em] transition lg:h-11 ${
                filters.customOnly
                  ? 'border-tm-gold bg-tm-gold text-tm-charcoal'
                  : 'border-black/10 bg-tm-off-white text-tm-warm-gray hover:border-tm-gold hover:text-tm-obsidian'
              }`}
            >
              Custom only
            </button>
          </div>

          <p className="font-dm text-[12px] text-tm-warm-gray">
            {filteredProducts.length} pieces matched{filters.customOnly ? ' - custom only' : ''}.
          </p>
        </div>
      </div>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Filtered results"
            title="Pieces ready to be tailored"
            body="Each card opens a richer product story with dimensions, finish choices, and direct routes into the visualiser and quote flow."
          />

          {filteredProducts.length ? (
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className={index % 5 === 0 ? 'xl:row-span-2' : ''}>
                  <ProductCard product={product} priority={index % 5 === 0} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-16 border border-dashed border-black/12 bg-[rgba(250,247,244,0.72)] p-12 text-center">
              <h3 className="font-cormorant text-4xl tracking-[-0.03em] text-tm-obsidian">No pieces matched these filters</h3>
              <p className="mx-auto mt-3 max-w-xl font-dm text-sm leading-7 text-tm-warm-gray">
                Try widening the room, material, or style filters. The catalogue updates instantly because the admin and client views share the same data.
              </p>
              <button
                type="button"
                onClick={() => setSearchParams(new URLSearchParams())}
                className="mt-6 inline-flex h-12 items-center border border-tm-gold px-5 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold transition hover:bg-tm-gold hover:text-tm-charcoal"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  active,
  onChange,
  capitalize = false,
}: {
  label: string;
  options: readonly string[];
  active: string;
  onChange: (value: string) => void;
  capitalize?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-dm text-[0.68rem] uppercase tracking-[0.26em] text-tm-warm-gray">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-10 border px-3 font-dm text-[0.7rem] uppercase tracking-[0.22em] transition lg:h-11 lg:px-4 ${
            active === option
              ? 'border-tm-gold bg-tm-gold/12 text-tm-obsidian'
              : 'border-black/10 bg-tm-off-white text-tm-warm-gray hover:border-tm-gold hover:text-tm-obsidian'
          }`}
        >
          {capitalize ? option[0].toUpperCase() + option.slice(1) : option}
        </button>
      ))}
    </div>
  );
}
