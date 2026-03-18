import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Award, Heart, Layers3, Ruler, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Button from '../components/Button';
import HeroSection from '../components/HeroSection';
import { ProductCard, Reveal, SectionIntro } from '../components/primitives';
import { featureProducts, asset } from '../data/content';
import { useTailoredStore } from '../store/useTailoredStore';
import Image from '../components/Image';


const trustSignals = [
  { label: 'Consult response', value: '24h', detail: 'Average first design follow-up' },
  { label: 'Lead time planning', value: '6-8 wks', detail: 'Typical made-to-order production window' },
  { label: 'Material direction', value: '4 hardwoods', detail: 'Curated timber library with finish guidance' },
  { label: 'Delivery model', value: 'Full install', detail: 'White-glove handoff from one team' },
];

const servicePillars = [
  {
    title: 'Room-first planning',
    body: 'We start with the scale, circulation, and light of the room before we finalise the furniture profile.',
    icon: Ruler,
  },
  {
    title: 'Layered visual clarity',
    body: 'The visualiser, material library, and quote flow are designed to help clients commit faster with fewer doubts.',
    icon: Layers3,
  },
  {
    title: 'White-glove delivery',
    body: 'Delivery, install, and styling are treated as part of the product, not an afterthought after production ends.',
    icon: Truck,
  },
  {
    title: 'Trust by craft',
    body: 'We keep the language grounded in real timber, real lead times, and real workshop capability so the brand feels credible.',
    icon: ShieldCheck,
  },
];

export default function Home() {
  const products = useTailoredStore((state) => state.products);
  const materials = useTailoredStore((state) => state.materials);
  const testimonials = useTailoredStore((state) => state.testimonials);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    if (!testimonials.length) return;
    const timer = setInterval(() => {
      setTestimonialIndex((current) => (current + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const featuredProducts = useMemo(
    () => products.filter((product) => featureProducts.includes(product.slug)),
    [products],
  );
  const heroProducts = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);
  const spotlightTestimonial = testimonials[testimonialIndex];

  return (
    <div className="overflow-hidden bg-tm-off-white">
      <HeroSection />

      <section className="bg-tm-charcoal py-10 text-tm-cream md:py-16">
        <div className="tm-container grid gap-4 grid-cols-2 lg:grid-cols-4">
          {trustSignals.map((signal, index) => (
            <Reveal key={signal.label} delay={index * 0.05}>
              <div className="border border-white/5 bg-white/[0.02] px-4 py-6 md:px-6 md:py-8 lg:px-8">
                <p className="font-dm text-[10px] uppercase tracking-[0.25em] text-tm-gold">{signal.label}</p>
                <p className="mt-4 font-cormorant text-[clamp(1.8rem,4vw,2.5rem)] font-light leading-none tracking-tight text-tm-cream">{signal.value}</p>
                <p className="mt-3 font-dm text-[13px] leading-relaxed text-tm-cream/40">{signal.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="tm-section bg-tm-charcoal text-tm-cream">
        <div className="tm-container">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="font-cormorant text-[clamp(2.2rem,5vw,4.5rem)] font-light leading-[1.1] tracking-tight text-tm-cream">
                Every piece of furniture we make exists nowhere else in the world.
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ['01', 'Made to your dimensions', 'Never a standard size'],
              ['02', 'From Zambian hardwood', 'Mukwa, teak, rosewood, mahogany'],
              ['03', 'Delivered and installed', 'We handle the full handoff'],
            ].map(([count, title, text], index) => (
              <Reveal key={count} delay={index * 0.08}>
                <div className="border border-white/5 bg-white/[0.02] p-8">
                  <p className="font-dm text-[10px] uppercase tracking-[0.3em] text-tm-gold">{count}</p>
                  <h3 className="mt-6 font-cormorant text-2xl font-light tracking-tight text-tm-cream">{title}</h3>
                  <p className="mt-4 font-dm text-[15px] leading-relaxed text-tm-cream/40">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="tm-section bg-tm-off-white">
        <div className="tm-container">
          <SectionIntro
            eyebrow="Signature service"
            title="Luxury that is planned around the room, not dropped into it."
            body="Tailored Manor elevates furniture design beyond the workshop. We integrate spatial planning and material expertise into a singular, high-confidence journey for the home."
          />
          
          <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_1fr] xl:gap-24">
            {/* Left Column: Workshop Atmosphere & Parallax-feel Image */}
            <div className="relative">
              <Reveal className="group relative h-full min-h-[500px] overflow-hidden rounded-[3rem]">
                <Image
                  src={asset('bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (4).jpg')}

                  alt="Craftsman hands working on premium Zambian hardwood"
                  fill
                  className="transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-tm-obsidian/5" />
              </Reveal>

              
              {/* Floating Confidence Accent (Overlaps the image) */}
              <Reveal delay={0.2} className="tm-card-glass absolute -bottom-6 -right-6 z-20 hidden max-w-[280px] p-8 shadow-2xl xl:block">
                <p className="font-dm text-[9px] uppercase tracking-[0.3em] text-tm-gold">The TM standard</p>
                <p className="mt-3 font-cormorant text-xl italic text-tm-obsidian">"Every joint is a promise of longevity and every finish a testament to Zambian timber."</p>
              </Reveal>
            </div>

            {/* Right Column: Service Pillars & Message */}
            <div className="flex flex-col justify-center gap-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                {servicePillars.map((pillar, index) => {
                  const Icon = pillar.icon;
                  return (
                    <Reveal 
                      key={pillar.title} 
                      delay={index * 0.1}
                      className="border border-black/[0.04] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] tm-card-lift"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-tm-gold/10 text-tm-gold">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="mt-6 font-cormorant text-xl font-medium tracking-tight text-tm-obsidian">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 font-dm text-[14px] leading-relaxed text-tm-warm-gray">{pillar.body}</p>
                    </Reveal>
                  );
                })}
              </div>

              <Reveal delay={0.4} className="rounded-[2.5rem] bg-tm-charcoal p-10 text-tm-cream lg:p-12">
                <div className="flex items-center gap-4">
                  <div className="h-px w-8 bg-tm-gold" />
                  <p className="font-dm text-[10px] uppercase tracking-[0.3em] text-tm-gold">One connected flow</p>
                </div>
                <p className="mt-6 font-cormorant text-3xl font-light leading-snug tracking-tight">Client confidence is our primary product.</p>
                <p className="mt-6 font-dm text-[15.5px] leading-relaxed text-tm-cream/60">
                  From initial room discovery to final installation, we manage the technical complexity so you can focus on the aesthetic experience of your home.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="tm-section bg-[#f5f0e8]">
        <div className="tm-container">
          <SectionIntro
            eyebrow="Zambian hardwood"
            title="The wood beneath your fingers"
            body="Every material is photographed and specified to preserve its natural warmth. No stock textures, no synthetic substitutes."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((material, index) => (
              <Reveal key={material.id} delay={index * 0.05}>
                <Link to={`/materials/${material.id}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[2rem] bg-tm-charcoal">
                  <Image
                    src={material.grainImage}
                    alt={material.name}
                    fill
                    className="transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-tm-obsidian/80 via-tm-obsidian/20 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <p className="font-dm text-[9px] uppercase tracking-[0.3em] text-tm-gold">{material.origin}</p>
                    <h3 className="mt-3 font-cormorant text-2xl font-light tracking-tight text-tm-cream">{material.name}</h3>
                    <p className="mt-4 line-clamp-2 font-dm text-[13px] leading-relaxed text-tm-cream/50 transition-opacity group-hover:opacity-100">{material.character}</p>
                    <span className="mt-6 flex items-center gap-2 font-dm text-[10px] font-bold uppercase tracking-[0.2em] text-tm-gold">
                      View Material
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="tm-section bg-tm-off-white">
        <div className="tm-container">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              eyebrow="Editorial collection"
              title="Our work"
              body="An intentionally quiet catalogue presentation, closer to an interiors annual than a retail grid."
            />
            <Link to="/collections" className="group flex items-center gap-2 font-dm text-[11px] font-bold uppercase tracking-widest text-tm-obsidian transition-colors hover:text-tm-gold">
              View all collections
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr] xl:grid-rows-[22rem_22rem]">
            {heroProducts.map((product, index) => (
              <div key={product.id} className={cn(
                "overflow-hidden rounded-[2.5rem]",
                index === 0 ? 'xl:row-span-2' : index === 3 ? 'xl:col-span-2 sm:col-span-2' : ''
              )}>
                <Reveal delay={index * 0.06} className="h-full">
                  <ProductCard product={product} priority={index === 0} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tm-section bg-[#f5f0e8]">
        <div className="tm-container">
          <div className="mx-auto max-w-3xl text-center">
            <SectionIntro
              eyebrow="How it works"
              title="From conversation to craftsmanship"
              body="A guided flow that starts with your room and ends with installation handled by one team."
              align="center"
            />
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['I', 'Consultation', 'We learn your space, your taste, and your life.'],
              ['II', 'Design', 'We sketch, render, and confirm every dimension.'],
              ['III', 'Craft', 'Your piece is handmade in our Lusaka workshop.'],
              ['IV', 'Install', 'We deliver, install, and style the room together.'],
            ].map(([step, title, copy], index) => (
              <Reveal key={step} delay={index * 0.06}>
                <div className="group rounded-[2rem] border border-black/5 bg-white p-8 text-center transition-all hover:bg-tm-gold/5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tm-gold/10 font-cormorant text-2xl text-tm-gold transition-transform group-hover:scale-110">
                    {step}
                  </div>
                  <h3 className="mt-6 font-cormorant text-2xl font-light tracking-tight text-tm-obsidian">{title}</h3>
                  <p className="mt-4 font-dm text-[15px] leading-relaxed text-tm-warm-gray">{copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Button to="/book-consultation" variant="primary" className="min-w-[280px]">
              Start Your Consultation
            </Button>
          </div>
        </div>
      </section>

      <section className="relative h-[80svh] min-h-[500px] overflow-hidden bg-tm-charcoal text-tm-cream">
        <motion.div 
          key={spotlightTestimonial.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <Image src={spotlightTestimonial.image} alt={spotlightTestimonial.location} fill />
          <div className="absolute inset-0 bg-gradient-to-b from-tm-obsidian/40 via-tm-obsidian/70 to-tm-obsidian/90" />
        </motion.div>

        
        <div className="tm-container relative flex h-full items-center">
          <div className="max-w-3xl">
            <Reveal>
              <p className="font-cormorant text-[clamp(1.8rem,4vw,3.2rem)] font-light italic leading-tight tracking-tight text-tm-cream">
                "{spotlightTestimonial.quote}"
              </p>
              <div className="mt-10 flex items-center gap-6">
                <div>
                  <p className="font-dm text-[11px] font-bold uppercase tracking-[0.3em] text-tm-gold">
                    {spotlightTestimonial.clientName}
                  </p>
                  <p className="mt-1 font-dm text-[11px] uppercase tracking-widest text-tm-cream/40">
                    {spotlightTestimonial.location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((current) => (current - 1 + testimonials.length) % testimonials.length)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-tm-cream transition-all hover:bg-tm-gold hover:text-tm-obsidian"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((current) => (current + 1) % testimonials.length)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-tm-cream transition-all hover:bg-tm-gold hover:text-tm-obsidian"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Our Promise section */}
      <section className="tm-section bg-tm-off-white">
        <div className="tm-container">
          <SectionIntro
            eyebrow="Our promise"
            title="Built to last, delivered with care"
            body="Every detail from first enquiry to final installation reflects our commitment to quality, heritage, and service."
            align="center"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: Award, title: 'Artisan Quality', body: 'Each piece is handcrafted by skilled artisans in our Lusaka workshop using time-honoured joinery techniques and the finest Zambian hardwoods.' },
              { icon: Heart, title: 'Heritage Materials', body: 'Mukwa, rosewood, teak, and mahogany — locally sourced with care for sustainability. Every grain tells a story of the Zambian landscape.' },
              { icon: Truck, title: 'Complete Service', body: 'From concept sketches to white-glove delivery and installation. Your room is styled and perfected by the same team that built each piece.' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.08}>
                  <div className="rounded-[2.5rem] border border-black/5 bg-white p-10 text-center tm-card-lift shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tm-gold/10 text-tm-gold transition-transform group-hover:rotate-6">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-8 font-cormorant text-2xl font-light tracking-tight text-tm-obsidian">{item.title}</h3>
                    <p className="mt-4 font-dm text-[15px] leading-relaxed text-tm-warm-gray">{item.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="tm-section relative overflow-hidden bg-tm-charcoal py-24 text-tm-cream lg:py-40">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tm-gold/10 blur-[120px]" />
        
        <div className="tm-container relative text-center">
          <SectionIntro
            eyebrow="Ready to begin"
            title="Your room is waiting."
            body="Talk to us. We will design, build, visualise, and install your perfect space with one connected team."
            align="center"
            dark
          />
          <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button to="/book-consultation" variant="primary" className="min-w-[300px]">
              Book Your Consultation
            </Button>
            <Link to="/collections" className="font-dm text-[11px] font-bold uppercase tracking-[0.3em] text-tm-cream/60 hover:text-tm-gold">
              Explore Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
