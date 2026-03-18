import { useEffect, useState } from 'react';
import Button from './Button';
import { Reveal, WordmarkLockup } from './primitives';

import { asset } from '../data/content';

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
    <section className="relative min-h-[calc(100vh-var(--tm-nav-height-mobile))] overflow-hidden bg-tm-charcoal text-tm-cream lg:min-h-[calc(100vh-var(--tm-nav-height))]">
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          poster={asset('bedroomfurniture/Crafted with durable, quality wood and finished with a clean, modern design — this bedroom setup (1).jpg')}
        >
          <source src={asset('videos/Behind every finished piece are skilled hands doing the work.This is Sikale, in motion - proudly.mp4')} type="video/mp4" />
        </video>
        {/* Darkened Overlay for Contrast */}
        <div className="absolute inset-0 bg-tm-obsidian/60" />
      </div>

      {/* Content Layer */}
      <div className="tm-container relative z-10 flex min-h-[inherit] items-center">
        <div className="grid w-full gap-12 lg:grid-cols-[58%_42%] lg:gap-20">
          <div className="flex flex-col justify-center py-20 lg:py-32">
            <Reveal className="mb-12 hidden lg:block">
              <WordmarkLockup inverted showTagline={false} className="opacity-80" />
            </Reveal>
            
            <div className="tm-eyebrow mb-8">
              <span>Bespoke furniture studio · Lusaka</span>
            </div>
            
            <TypewriterHeadline />
            
            <Reveal delay={0.6}>
              <p className="mt-8 max-w-[460px] font-dm text-[clamp(16px,1.1vw,18px)] font-light leading-[1.8] text-tm-cream/60">
                Bespoke hardwood furniture, handcrafted in Zambia from the finest local timber and tailored to the exact rhythm of your room.
              </p>
            </Reveal>

            <Reveal delay={0.8} className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-6">
              <Button to="/visualise" variant="primary" className="px-10 py-5">
                Visualise Your Space
              </Button>
              <Button to="/collections" variant="secondary" className="px-10 py-5">
                Explore Collections
              </Button>
            </Reveal>
          </div>
          
          {/* Right column empty to allow video to breathe on desktop */}
          <div className="hidden lg:block" />
        </div>
      </div>
      
      {/* Mobile-only bottom fade to blend with next section */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-tm-charcoal to-transparent lg:hidden" />
    </section>
  );
}

