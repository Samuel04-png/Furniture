import { ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import { PageHero, Reveal, SectionIntro } from '../components/primitives';
import { asset } from '../data/content';


const steps = [
  ['Consultation', 'We start with your room, your routines, and your design references.'],
  ['Concept Direction', 'The team translates that brief into product suggestions, layouts, and material pairings.'],
  ['Detailed Configuration', 'Dimensions, finishes, upholstery, and room scale are confirmed together.'],
  ['Craft & Installation', 'Production, delivery, and styling happen through one connected workflow.'],
];

export default function TheProcess() {
  return (
    <div className="bg-tm-off-white">
      <PageHero
        eyebrow="The Tailored Manor method"
        title="Designed to feel personal from the first enquiry"
        body="The digital platform mirrors the studio process: discover, visualise, specify, then hand off to production without friction."
        image={asset('ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (3).jpg')}
        heightClassName="min-h-[58svh]"

      />
      <section className="tm-section">
        <div className="tm-container max-w-6xl">
          <SectionIntro
            eyebrow="Four stages"
            title="A luxury consultation flow, not an ordinary checkout"
            body="Each stage is designed to reduce uncertainty, surface the right details early, and preserve the premium feeling of the brand."
            align="center"
          />
          <div className="relative mt-10 space-y-3">
            <div className="absolute left-7 top-4 hidden h-[calc(100%-2rem)] border-l border-dashed border-tm-gold/45 md:block" />
            {steps.map(([title, copy], index) => (
              <Reveal key={title} delay={index * 0.08}>
                <div className="grid gap-5 border border-black/10 bg-tm-off-white p-6 md:grid-cols-[6rem_1fr] md:p-8">
                  <div className="flex h-14 w-14 items-center justify-center border border-tm-gold font-cormorant text-2xl text-tm-gold md:h-16 md:w-16">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="font-cormorant text-[2rem] font-medium leading-none tracking-[-0.03em] text-tm-obsidian">{title}</h3>
                    <p className="mt-4 max-w-3xl font-dm text-[16px] leading-[1.75] text-tm-warm-gray">{copy}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button to="/book-consultation" variant="minimal" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right" className="text-tm-obsidian">
              Book a consultation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
