import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { navLinks } from '../../data/content';
import { cn } from '../../lib/utils';
import Button from '../Button';
import { LogoMark } from '../primitives';

export default function Navbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled && !open;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-[90] transition-all duration-300',
        isTransparent ? 'bg-transparent py-4 text-tm-cream' : 'tm-glass-dark py-0 text-tm-cream shadow-2xl',
      )}
    >
      <div className="tm-container flex h-[var(--tm-nav-height-mobile)] items-center justify-between md:grid md:h-[var(--tm-nav-height)] md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <Link to="/" className="flex items-center transition-opacity hover:opacity-80" aria-label="Tailored Manor home">
          <LogoMark inverted compact size={isScrolled ? 34 : 40} />
        </Link>

        <nav className="hidden items-center justify-center gap-12 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'relative font-dm text-[12px] font-medium uppercase tracking-[0.16em] transition-colors duration-200',
                  active ? 'text-tm-gold' : 'text-tm-cream/70 hover:text-tm-gold',
                  'after:absolute after:-bottom-2 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-tm-gold after:transition-all after:duration-300 hover:after:w-full',
                  active && 'after:w-full',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end">
          <div className="hidden md:block">
            <Button to="/book-consultation" variant="minimal" className="h-11">
              Book Consultation
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-tm-cream transition-colors hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="overflow-hidden bg-tm-charcoal/98 backdrop-blur-2xl md:hidden"
      >
        <div className="tm-container pb-8 pt-4">
          <nav className="flex flex-col gap-6 border-t border-white/5 pt-8">
            {navLinks.map((link) => {
              const active = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'font-dm text-[14px] font-medium uppercase tracking-[0.2em]',
                    active ? 'text-tm-gold' : 'text-tm-cream/60 hover:text-tm-gold',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-10">
            <Button to="/book-consultation" variant="primary" fullWidth>
              Book Consultation
            </Button>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
