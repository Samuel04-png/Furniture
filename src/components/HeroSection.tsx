import { useEffect, useState } from 'react';
import Button from './Button';
import { WordmarkLockup } from './primitives';

function TypewriterHeadline() {
  const lines = ['Your Space.', 'Masterfully Tailored.'];
  const target = lines.join('\n');
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(target.length);
      return;
    }

    let interval = 0;
    const delay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setVisible((value) => {
          if (value >= target.length) {
            window.clearInterval(interval);
            return value;
          }
          return value + 1;
        });
      }, 24);
    }, 140);

    return () => {
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
  }, [target.length]);

  const rendered = target.slice(0, visible).split('\n');

  return (
    <h1 className="font-cormorant text-[clamp(4rem,7vw,6rem)] font-light leading-[0.92] tracking-[-0.025em] text-tm-cream lg:text-[96px]">
      {lines.map((_, lineIndex) => {
        const line = rendered[lineIndex] ?? '';
        return (
          <span key={lineIndex} className="block min-h-[0.98em]">
            {[...line].map((character, characterIndex) => (
              <span key={`${lineIndex}-${characterIndex}`} className={character === '.' ? 'text-tm-gold' : undefined}>
                {character}
              </span>
            ))}
          </span>
        );
      })}
    </h1>
  );
}

export default function HeroSection() {
  return (
    <section className="bg-tm-obsidian pt-[var(--tm-nav-height-mobile)] text-tm-cream md:pt-[var(--tm-nav-height)]">
      <div className="grid min-h-[calc(100vh-var(--tm-nav-height-mobile))] lg:min-h-[calc(100vh-var(--tm-nav-height))] lg:grid-cols-[54%_46%]">
        <div className="relative z-0 min-h-[46svh] overflow-hidden lg:min-h-full">
          <img
            src="https://images.pexels.com/photos/6790932/pexels-photo-6790932.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Tailored Manor workshop craftsmanship"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover tm-ken-burns"
          />
          {/* Mobile-only integrated overlay and gradient blend */}
          <div className="absolute inset-0 bg-tm-obsidian/35 lg:hidden" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-tm-charcoal via-tm-charcoal/90 to-transparent lg:hidden" />
        </div>

        <div className="relative z-10 -mt-20 bg-tm-charcoal lg:mt-0">
          <div className="flex min-h-full items-center px-6 pb-20 pt-16 sm:px-10 lg:px-16 lg:py-24">
            <div className="max-w-[620px]">
              <WordmarkLockup inverted className="mb-16 hidden lg:block" />
              <div className="tm-eyebrow">
                <span>Bespoke furniture studio · Lusaka</span>
              </div>
              <div className="mt-6">
                <TypewriterHeadline />
              </div>
              <p className="mt-8 max-w-[420px] font-dm text-[clamp(15.5px,1vw,17.5px)] font-light leading-[1.8] text-[rgba(245,239,230,0.6)]">
                Bespoke hardwood furniture, handcrafted in Zambia from the finest local timber and tailored to the exact rhythm of your room.
              </p>
              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-5">
                <Button to="/visualise" variant="primary" className="min-w-[220px]">
                  Visualise Your Space
                </Button>
                <Button to="/collections" variant="secondary" className="min-w-[220px]">
                  Explore Collections
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
