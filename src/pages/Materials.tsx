import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import { PageHero, Reveal, SectionIntro } from '../components/primitives';
import { useTailoredStore } from '../store/useTailoredStore';

export default function Materials() {
  const materials = useTailoredStore((state) => state.materials);

  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="Material library"
        title="Zambian hardwood, treated as the hero"
        body="The platform treats material as more than a dropdown. Each timber has its own visual identity, tonal range, and ideal applications."
        image="https://images.pexels.com/photos/13570885/pexels-photo-13570885.jpeg?auto=compress&cs=tinysrgb&w=1800"
        heightClassName="min-h-[58svh]"
      />

      <section className="tm-section">
        <div className="tm-container">
          <SectionIntro
            eyebrow="Material deep dive"
            title="Chosen for warmth, durability, and presence"
            body="Warm tones, visible grain movement, and finish behaviour are part of the design conversation from the start."
          />

          <div className="mt-10 space-y-6">
            {materials.map((material, index) => (
              <Reveal key={material.id} delay={index * 0.08}>
                <div className={`grid gap-8 overflow-hidden border border-black/10 bg-tm-off-white lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-last' : ''}`}>
                  <div className="relative min-h-[26rem] overflow-hidden">
                    <img src={material.grainImage} alt={material.name} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-[rgba(12,12,12,0.18)]" />
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-10">
                    <p className="font-dm text-[11px] uppercase tracking-[0.25em] text-tm-gold">{material.origin}</p>
                    <h2 className="mt-4 font-cormorant text-[clamp(2.6rem,4vw,4rem)] font-light leading-[0.96] tracking-[-0.04em] text-tm-obsidian">
                      {material.name}
                    </h2>
                    <p className="mt-6 font-dm text-[16px] leading-[1.75] text-tm-warm-gray">{material.description}</p>
                    <p className="mt-4 font-dm text-[16px] leading-[1.75] text-tm-warm-gray">{material.character}</p>

                    <div className="mt-8">
                      <p className="font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">Best suited to</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {material.bestFor.map((item) => (
                          <span key={item} className="border border-black/12 px-4 py-2 font-dm text-[11px] uppercase tracking-[0.18em] text-tm-obsidian">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <Button to={`/materials/${material.id}`} variant="minimal" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right" className="bg-tm-obsidian hover:bg-tm-obsidian hover:text-tm-cream">
                        View material profile
                      </Button>
                      <Button to={`/configure?material=${material.id}`} variant="minimal" className="text-tm-obsidian">
                        Configure in {material.name}
                      </Button>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
