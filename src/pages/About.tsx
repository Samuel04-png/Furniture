import { Link } from 'react-router-dom';
import { ArrowRight, Gem, Ruler, Trees, Users } from 'lucide-react';
import Image from '../components/Image';
import { PageHero, SectionIntro } from '../components/primitives';
import { getWebsiteMediaItem } from '../lib/websiteMedia';
import { asset } from '../config/site';
import { useTailoredStore } from '../store/useTailoredStore';


export default function About() {
  const team = useTailoredStore((state) => state.publicTeamMembers);
  const companySettings = useTailoredStore((state) => state.companySettings);
  const heroMedia = getWebsiteMediaItem(companySettings, 'aboutHero');

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Brand story"
        title="An interior experience studio, not a furniture shop"
        body="Tailored Manor is built around a simple idea: a room should not be furnished generically when it can be composed intentionally."
        image={heroMedia.image}
        heightClassName="min-h-[58svh]"

      />

      {/* Craftsmanship & Materials */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionIntro
              eyebrow="Our materials"
              title="Sourced with intention, finished with care"
              body="Every piece begins with timber selected for character, not convenience. Mukwa, Rosewood, Teak, and Mahogany — each chosen for grain, durability, and presence in the Zambian landscape."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                { icon: Trees, label: 'Zambian hardwoods', desc: 'Sustainably sourced from managed forests and trusted local suppliers.' },
                { icon: Gem, label: 'Hand-finished surfaces', desc: 'Every finish — matt, medium gloss, or high gloss — is applied by artisans who understand the wood.' },
                { icon: Ruler, label: 'Precision joinery', desc: 'Mortise and tenon, dovetail, and finger joints built to last generations.' },
                { icon: Users, label: 'Local craft, global standard', desc: 'Our workshop team brings decades of combined experience to every commission.' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-black/8 bg-white p-5">
                  <item.icon className="h-6 w-6 text-tm-gold" />
                  <h3 className="mt-3 font-cormorant text-xl tracking-[-0.02em] text-tm-obsidian">{item.label}</h3>
                  <p className="mt-2 font-dm text-sm leading-6 text-tm-warm-gray">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-tm-charcoal">
            <Image
              src={asset('bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (4).jpg')}
              alt="Craftsmanship detail"
              className="h-[32rem] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tm-charcoal/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="font-cormorant text-2xl italic leading-snug text-tm-cream">
                "The timber tells its own story. We just help it find the right room."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="border-t border-black/6 bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="How we work"
            title="From conversation to completion"
            body="Our process is designed to give you confidence before a single cut is made. Every step is transparent, collaborative, and unhurried."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Consultation', desc: 'We listen to your vision, measure your space, and explore material and finish options together — in person or over a video call.' },
              { step: '02', title: 'Design & Proposal', desc: 'You receive dimensioned drawings, material samples, and a transparent quote. Nothing proceeds without your approval.' },
              { step: '03', title: 'Craft & Install', desc: 'Your pieces are built in our Lusaka workshop, finished to specification, and installed with care. We do not leave until the room feels right.' },
            ].map((item) => (
              <div key={item.step} className="rounded-[1.6rem] border border-black/8 bg-tm-off-white p-8">
                <span className="font-dm text-[2.4rem] font-light tracking-[-0.04em] text-tm-gold">{item.step}</span>
                <h3 className="mt-4 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{item.title}</h3>
                <p className="mt-3 font-dm text-sm leading-7 text-tm-warm-gray">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/the-process" className="inline-flex items-center gap-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold transition hover:text-tm-obsidian">
              View the full process
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="What we believe"
            title="Furniture worth the wait"
            body="In a world of flat-pack and fast fashion, we take the opposite approach. Our pieces are built to anchor a room for decades, not seasons."
          />
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-[2rem] border border-black/8 bg-white p-8 md:p-10">
              <h3 className="font-cormorant text-[2.2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Quality over volume</h3>
              <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">
                We take on a limited number of projects at any time. This keeps the workshop focused, the craft precise, and your experience personal. Every piece receives the attention it deserves because we never rush a commission.
              </p>
            </div>
            <div className="rounded-[2rem] border border-black/8 bg-white p-8 md:p-10">
              <h3 className="font-cormorant text-[2.2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Rooms, not products</h3>
              <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">
                We design furniture in context — considering light, proportion, existing pieces, and how the room will be lived in. A dining table is not just a surface; it is where your family gathers, where stories are shared, where life happens.
              </p>
            </div>
            <div className="rounded-[2rem] border border-black/8 bg-white p-8 md:p-10">
              <h3 className="font-cormorant text-[2.2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Transparent pricing</h3>
              <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">
                Every quote is itemised — material, labour, finish, and installation. No hidden fees, no surprise charges. You know exactly what you are paying for and why it costs what it does. Our indicative pricing gives you a clear starting point.
              </p>
            </div>
            <div className="rounded-[2rem] border border-black/8 bg-white p-8 md:p-10">
              <h3 className="font-cormorant text-[2.2rem] leading-none tracking-[-0.03em] text-tm-obsidian">Zambian at heart</h3>
              <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">
                We are proudly based in Lusaka, sourcing timber from within the region and employing local craftspeople. Every commission supports Zambian artisanship and contributes to a growing ecosystem of premium African design and manufacturing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-t border-black/6 bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Who we are"
            title="African warmth with European restraint"
            body="The studio celebrates Zambian materials, calm detailing, and digital tools that help clients feel certain before commissioning a custom piece."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {team.map((member) => (
              <div key={member.id} className="rounded-[2rem] border border-black/8 bg-tm-off-white p-6 text-center transition hover:shadow-[0_12px_40px_rgba(12,12,12,0.06)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f1e7] font-cormorant text-2xl text-tm-gold ring-1 ring-tm-gold/20">
                  {member.initials}
                </div>
                <h3 className="mt-5 font-cormorant text-[2rem] leading-none tracking-[-0.03em] text-tm-obsidian">{member.name}</h3>
                <p className="mt-2 font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">{member.role}</p>
                <p className="mt-4 font-dm text-sm leading-7 text-tm-warm-gray">{member.email}</p>
              </div>
            ))}
          </div>
          {team.length === 0 && (
            <div className="mt-14 rounded-[2rem] border border-dashed border-black/12 bg-tm-off-white p-12 text-center">
              <p className="font-cormorant text-2xl text-tm-warm-gray">Team profiles coming soon</p>
              <p className="mt-3 font-dm text-sm text-tm-warm-gray">Our studio team is being profiled. Check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2.4rem] bg-tm-obsidian p-10 text-center md:p-16">
          <p className="font-dm text-[0.72rem] uppercase tracking-[0.24em] text-tm-gold">Let's create something together</p>
          <h2 className="mt-6 font-cormorant text-[clamp(2.4rem,4vw,3.6rem)] leading-[0.98] tracking-[-0.03em] text-tm-cream">
            Ready to design a room<br />that feels unmistakably yours?
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-dm text-sm leading-7 text-tm-cream/70">
            Whether you have a clear vision or just a vague sense of what you want, our consultation process is designed to bring clarity. No obligation, no pressure — just honest guidance from people who care about craft.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/book-consultation" className="inline-flex items-center gap-2 rounded-full bg-tm-gold px-8 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-charcoal transition hover:bg-tm-gold/90">
              Book a consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/collections" className="inline-flex items-center gap-2 rounded-full border border-tm-cream/20 px-8 py-4 font-dm text-[0.78rem] uppercase tracking-[0.24em] text-tm-cream transition hover:border-tm-gold hover:text-tm-gold">
              Browse the collection
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
