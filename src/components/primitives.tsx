import React, { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from './Button';
import { cn, formatCurrency } from '../lib/utils';
import type { DimensionSet, Product } from '../types';
import Image from './Image';


export function LogoMark({
  inverted = false,
  compact = false,
  size = 36,
}: {
  inverted?: boolean;
  compact?: boolean;
  size?: number;
}) {
  return (
    <div className={cn('flex items-center gap-4', compact && 'gap-0')}>
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full border',
          inverted ? 'border-[rgba(245,239,230,0.38)] text-tm-cream' : 'border-black/18 text-tm-obsidian',
        )}
        style={{ width: size, height: size }}
      >
        <span className="font-cormorant text-[1.2rem] leading-none tracking-[0.04em]">TM</span>
        <span className="absolute inset-[4px] rounded-full border border-tm-gold/70" />
      </div>
      {!compact ? <WordmarkLockup inverted={inverted} /> : null}
    </div>
  );
}

export function WordmarkLockup({
  inverted = false,
  className,
  showTagline = true,
}: {
  inverted?: boolean;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={className}>
      <p className={cn('tm-wordmark', inverted ? 'text-tm-cream' : 'text-tm-obsidian')}>Tailored Manor</p>
      {showTagline ? (
        <p className={cn('tm-tagline', inverted ? 'text-tm-gold' : 'text-tm-warm-gray')}>
          Your Space Masterfully Tailored
        </p>
      ) : null}
    </div>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  body,
  align = 'left',
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  dark?: boolean;
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <div className={cn('mb-4 flex', align === 'center' ? 'justify-center' : 'justify-start')}>
          <p className="tm-eyebrow">{eyebrow}</p>
        </div>
      ) : null}
      <h2
        className={cn(
          'font-cormorant text-[36px] font-light leading-none tracking-[-0.02em] md:text-[56px]',
          dark ? 'text-tm-cream' : 'text-tm-obsidian',
        )}
      >
        {title}
      </h2>
      {body ? (
        <p
          className={cn(
            'mt-10 max-w-2xl font-dm text-[16px] leading-[1.75]',
            dark ? 'text-[rgba(245,239,230,0.7)]' : 'text-tm-warm-gray',
            align === 'center' && 'mx-auto',
          )}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  body,
  image,
  heightClassName = 'min-h-[70svh]',
  align = 'left',
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  image: string;
  heightClassName?: string;
  align?: 'left' | 'center';
  children?: ReactNode;
}) {
  return (
    <section className={cn('relative isolate overflow-hidden bg-tm-charcoal', heightClassName)}>
      <Image
        src={image}
        alt={title}
        priority
        fill
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[rgba(12,12,12,0.58)]" />
      <div className="tm-container relative flex h-full items-end py-28 md:py-36">
        <div className={cn('max-w-4xl', align === 'center' && 'mx-auto text-center')}>
          {eyebrow ? (
            <div className={cn('mb-4 flex', align === 'center' ? 'justify-center' : 'justify-start')}>
              <p className="tm-eyebrow">{eyebrow}</p>
            </div>
          ) : null}
          <h1 className="font-cormorant text-[clamp(3.2rem,6vw,5.6rem)] font-light leading-[0.94] tracking-[-0.03em] text-tm-cream">
            {title}
          </h1>
          {body ? (
            <p className={cn('mt-10 max-w-2xl font-dm text-[16px] leading-[1.75] text-[rgba(245,239,230,0.7)]', align === 'center' && 'mx-auto')}>
              {body}
            </p>
          ) : null}
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link
      to={`/collections/${product.slug}`}
      className={cn('group relative block overflow-hidden bg-tm-charcoal', priority ? 'min-h-[36rem]' : 'min-h-[30rem]')}
    >
      <Image
        src={priority ? product.heroImage : product.cardImage}
        alt={product.name}
        priority={priority}
        fill
        className="transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
      />

      <div className="absolute inset-0 bg-[rgba(12,12,12,0.3)] opacity-0 transition duration-300 ease-out group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 p-6 opacity-100 transition duration-300 ease-out md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        <p className="font-dm text-[11px] uppercase tracking-[0.2em] text-tm-gold">{product.category}</p>
        <h3 className="mt-3 font-cormorant text-[20px] font-medium leading-none tracking-[-0.02em] text-tm-cream">
          {product.name}
        </h3>
        <p className="mt-3 font-dm text-[14px] text-[rgba(245,239,230,0.7)]">From {formatCurrency(product.priceFrom)}</p>
        <span className="mt-4 inline-flex items-center gap-2 font-dm text-[11px] uppercase tracking-[0.18em] text-tm-cream">
          View Details
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function DimensionDiagram({
  dimensions,
  label,
  className,
}: {
  dimensions: DimensionSet;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('border border-black/12 bg-tm-off-white p-6', className)}>
      {label ? <p className="mb-4 font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</p> : null}
      <svg viewBox="0 0 240 180" className="w-full">
        <rect x="42" y="56" width="112" height="54" fill="none" stroke="#0C0C0C" strokeWidth="2.5" />
        <path d="M154 56 L186 34 L186 88 L154 110" fill="none" stroke="#0C0C0C" strokeWidth="2.5" />
        <path d="M42 56 L74 34 L186 34" fill="none" stroke="#0C0C0C" strokeWidth="2.5" />
        <line x1="42" y1="126" x2="154" y2="126" stroke="#B8935A" strokeWidth="1.5" strokeDasharray="6 5" />
        <line x1="32" y1="56" x2="32" y2="110" stroke="#B8935A" strokeWidth="1.5" strokeDasharray="6 5" />
        <line x1="154" y1="120" x2="186" y2="98" stroke="#B8935A" strokeWidth="1.5" strokeDasharray="6 5" />
        <text x="98" y="145" textAnchor="middle" fill="#8C7B6B" fontSize="12" fontFamily="DM Sans">
          W {dimensions.width} cm
        </text>
        <text x="22" y="86" textAnchor="middle" fill="#8C7B6B" fontSize="12" fontFamily="DM Sans">
          H {dimensions.height}
        </text>
        <text x="192" y="112" fill="#8C7B6B" fontSize="12" fontFamily="DM Sans">
          D {dimensions.depth}
        </text>
      </svg>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'gold' | 'success' | 'error';
}) {
  return (
    <span
      className={cn(
        'inline-flex border px-3 py-1 font-dm text-[11px] uppercase tracking-[0.18em]',
        tone === 'gold' && 'border-tm-gold/30 bg-tm-gold/8 text-tm-gold',
        tone === 'success' && 'border-tm-success/30 bg-tm-success/10 text-tm-success',
        tone === 'error' && 'border-tm-error/30 bg-tm-error/10 text-tm-error',
        tone === 'neutral' && 'border-black/10 bg-transparent text-tm-warm-gray',
      )}
    >
      {children}
    </span>
  );
}

export function InputField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</span>
      <input
        {...props}
        className={cn(
          'w-full rounded-[4px] border border-black/12 bg-tm-off-white px-4 py-3.5 font-dm text-sm text-tm-obsidian outline-none transition focus:border-tm-gold',
          className,
        )}
      />
    </label>
  );
}

export function SelectField({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</span>
      <select
        {...props}
        className={cn(
          'w-full rounded-[4px] border border-black/12 bg-tm-off-white px-4 py-3.5 font-dm text-sm text-tm-obsidian outline-none transition focus:border-tm-gold',
          className,
        )}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</span>
      <textarea
        {...props}
        className={cn(
          'w-full rounded-[4px] border border-black/12 bg-tm-off-white px-4 py-3.5 font-dm text-sm text-tm-obsidian outline-none transition focus:border-tm-gold',
          className,
        )}
      />
    </label>
  );
}

export function MetricCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="border border-black/12 bg-tm-off-white p-6">
      <p className="font-dm text-[11px] uppercase tracking-[0.2em] text-tm-warm-gray">{label}</p>
      <p className="mt-4 font-cormorant text-[2.4rem] font-light leading-none tracking-[-0.03em] text-tm-obsidian">{value}</p>
      {meta ? <p className="mt-4 font-dm text-sm text-tm-warm-gray">{meta}</p> : null}
    </div>
  );
}

export function EmptyPanel({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="border border-dashed border-black/18 bg-tm-off-white px-6 py-12 text-center">
      <h3 className="font-cormorant text-[32px] font-light tracking-[-0.02em] text-tm-obsidian">{title}</h3>
      <p className="mx-auto mt-4 max-w-xl font-dm text-sm leading-[1.75] text-tm-warm-gray">{body}</p>
      {actionLabel && actionHref ? (
        <div className="mt-8 flex justify-center">
          <Button to={actionHref} variant="minimal" className="text-tm-obsidian">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function Reveal({ 
  children, 
  delay = 0, 
  className = '', 
  style = {} 
}: { 
  children: ReactNode; 
  delay?: number; 
  className?: string; 
  style?: React.CSSProperties; 
}) {
  return (
    <div 
      className={className} 
      style={{ ...style }} 
      data-reveal-delay={delay}
    >
      {children}
    </div>
  );
}
