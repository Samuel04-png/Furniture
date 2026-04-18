import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const adminButtonBaseClass =
  'group inline-flex min-h-[2.95rem] min-w-[8.75rem] items-center justify-center gap-2 rounded-[1rem] border px-4 py-3 font-dm text-[0.74rem] font-semibold uppercase leading-none tracking-[0.14em] whitespace-nowrap appearance-none select-none transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] disabled:cursor-not-allowed disabled:opacity-55';

const adminButtonToneClass = {
  primary:
    'border-[#231d18] bg-tm-charcoal text-tm-cream shadow-[0_10px_24px_rgba(12,12,12,0.08)] hover:-translate-y-[1px] hover:bg-[#15110d] hover:shadow-[0_14px_28px_rgba(12,12,12,0.12)] active:translate-y-0',
  secondary:
    'border-[#d8c19b] bg-[#fbf4e8] text-tm-charcoal shadow-[0_6px_16px_rgba(12,12,12,0.03)] hover:-translate-y-[1px] hover:border-[#caa66a] hover:bg-[#f7ebd9] hover:shadow-[0_10px_22px_rgba(12,12,12,0.06)] active:translate-y-0',
  ghost:
    'border-black/10 bg-white/92 text-tm-charcoal shadow-[0_4px_12px_rgba(12,12,12,0.03)] hover:-translate-y-[1px] hover:border-black/14 hover:bg-white hover:shadow-[0_10px_22px_rgba(12,12,12,0.06)] active:translate-y-0',
  danger:
    'border-[#8f1e1e] bg-[#8f1e1e] text-white shadow-[0_8px_22px_rgba(143,30,30,0.16)] hover:-translate-y-[1px] hover:border-[#7a1717] hover:bg-[#7a1717] hover:shadow-[0_12px_26px_rgba(122,23,23,0.2)] active:translate-y-0',
} as const;

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-6 sm:space-y-7 lg:space-y-8', className)}>{children}</div>;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-4xl">
        {eyebrow ? (
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-tm-gold/88">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-cormorant text-[1.95rem] leading-[0.98] tracking-[-0.03em] text-tm-charcoal sm:text-[2.28rem]">
          {title}
        </h1>
        {description ? <p className="mt-3 max-w-3xl text-[0.95rem] leading-7 text-tm-warm-gray">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-start gap-2.5 sm:items-center">{actions}</div> : null}
    </div>
  );
}

export function AdminButton({
  children,
  className,
  tone = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button
      {...props}
      className={cn(
        adminButtonBaseClass,
        adminButtonToneClass[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AdminLinkButton({
  to,
  children,
  className,
  tone = 'secondary',
}: {
  to: string;
  children: ReactNode;
  className?: string;
  tone?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <Link
      to={to}
      className={cn(
        adminButtonBaseClass,
        adminButtonToneClass[tone],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function AdminAnchorButton({
  href,
  children,
  className,
  tone = 'secondary',
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  className?: string;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <a
      href={href}
      className={cn(adminButtonBaseClass, adminButtonToneClass[tone], className)}
      {...props}
    >
      {children}
    </a>
  );
}

export function AdminSubnav({
  items,
}: {
  items: Array<{ label: string; href: string; active?: boolean; count?: number }>;
}) {
  return (
    <div className="hide-scrollbar flex gap-2.5 overflow-x-auto overscroll-x-contain pb-1 scroll-px-1">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'inline-flex min-h-[2.8rem] shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 font-dm text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2]',
            item.active
              ? 'border-[#231d18] bg-[#1c1814] text-tm-cream shadow-[0_10px_20px_rgba(12,12,12,0.08)]'
              : 'border-black/8 bg-white/92 text-tm-charcoal/74 hover:-translate-y-[1px] hover:border-black/12 hover:bg-white hover:text-tm-charcoal hover:shadow-[0_8px_18px_rgba(12,12,12,0.04)]',
          )}
        >
          <span>{item.label}</span>
          {typeof item.count === 'number' ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[0.66rem] tracking-[0.12em]',
                item.active ? 'bg-white/12 text-tm-cream' : 'bg-black/5 text-tm-warm-gray',
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function AdminSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[1.65rem] border border-black/5 bg-white/[0.98] p-5 shadow-[0_10px_24px_rgba(12,12,12,0.035)] sm:p-6 lg:p-7',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminSurfaceHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-[0.98rem] font-semibold tracking-[-0.02em] text-tm-charcoal">{title}</h2>
        {description ? <p className="mt-1 max-w-xl text-sm leading-6 text-tm-warm-gray">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function AdminMetric({
  label,
  value,
  meta,
  tone = 'default',
  className,
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: 'default' | 'warm' | 'alert';
  className?: string;
}) {
  const hasLongValue = value.length > 18 || value.includes(' ');
  return (
    <div
      className={cn(
        'rounded-[1.45rem] border p-5',
        tone === 'default' && 'border-black/7 bg-white',
        tone === 'warm' && 'border-[#dfc69d] bg-[#fbf6ed]',
        tone === 'alert' && 'border-[#d9a8a8] bg-[#fff6f5]',
        className,
      )}
    >
      <p className="text-[0.64rem] font-medium uppercase tracking-[0.24em] text-tm-warm-gray">{label}</p>
      <p
        className={cn(
          'mt-4 text-tm-charcoal',
          hasLongValue
            ? 'max-w-[18ch] text-lg font-semibold leading-snug tracking-[-0.02em] sm:text-[1.22rem]'
            : 'font-cormorant text-[2rem] leading-none tracking-[-0.03em]',
        )}
      >
        {value}
      </p>
      {meta ? <p className="mt-3 text-sm leading-6 text-tm-warm-gray">{meta}</p> : null}
    </div>
  );
}

export function AdminToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky top-3 z-10 flex flex-col items-stretch gap-2.5 rounded-[1.15rem] border border-black/5 bg-[rgba(250,247,244,0.86)] p-2.5 shadow-[0_8px_20px_rgba(12,12,12,0.03)] backdrop-blur-md sm:p-3 lg:flex-row lg:items-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminStatusChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const tones = {
    neutral: 'bg-[#f3ece3] text-tm-warm-gray',
    success: 'bg-[#edf7ef] text-[#2f6d40]',
    warning: 'bg-[#fdf2e2] text-[#94642d]',
    danger: 'bg-[#fce9e9] text-[#8f1e1e]',
    accent: 'bg-[#f3ecdf] text-[#7a5b2f]',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[0.64rem] font-medium uppercase tracking-[0.18em]', tones[tone])}>
      {label}
    </span>
  );
}

export function AdminEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.45rem] border border-dashed border-black/10 bg-[#fbf7f1] px-5 py-10 text-center">
      <h3 className="text-base font-semibold text-tm-charcoal">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-tm-warm-gray">{body}</p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}

export function AdminModal({
  open,
  title,
  description,
  children,
  onClose,
  width = 'max-w-2xl',
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(12,12,12,0.46)] p-2 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={cn('flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-[1.6rem] bg-[#f9f6f1] shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:h-auto sm:max-h-[92vh] sm:rounded-[1.8rem]', width)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-[1] flex items-start justify-between gap-4 border-b border-black/7 bg-[#f9f6f1]/96 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
          <div>
            <h3 className="font-cormorant text-[1.9rem] leading-none tracking-[-0.03em] text-tm-charcoal">{title}</h3>
            {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-tm-warm-gray">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/80 text-tm-charcoal transition hover:bg-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

export function AdminDrawer({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[78] bg-[rgba(12,12,12,0.28)] transition duration-200 ease-out',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'absolute inset-2 flex flex-col overflow-hidden rounded-[1.6rem] bg-[#f9f6f1] shadow-[0_30px_90px_rgba(0,0,0,0.24)] transition sm:inset-y-0 sm:right-0 sm:left-auto sm:h-auto sm:w-[min(640px,100vw)] sm:rounded-none sm:rounded-l-[1.8rem]',
          open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full sm:translate-y-0',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-[1] flex items-start justify-between gap-4 border-b border-black/7 bg-[#f9f6f1]/96 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
          <div>
            <h3 className="font-cormorant text-[1.8rem] leading-none tracking-[-0.03em] text-tm-charcoal">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-tm-warm-gray">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white/80 text-tm-charcoal transition hover:bg-white"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

export function AdminListRow({
  title,
  subtitle,
  meta,
  active,
  onClick,
  status,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  active?: boolean;
  onClick?: () => void;
  status?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-[1.15rem] border px-4 py-4 text-left transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tm-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] sm:flex-row sm:items-center sm:justify-between',
        active
          ? 'border-[#d8c19b] bg-[#fbf6ef]'
          : 'border-black/6 bg-white hover:border-black/10 hover:bg-[#fbf7f1]',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-tm-charcoal">{title}</p>
        {subtitle ? <p className="mt-1 truncate text-sm leading-6 text-tm-warm-gray">{subtitle}</p> : null}
        {meta ? <p className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-tm-warm-gray">{meta}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
        {status}
        <ChevronRight className="h-4 w-4 text-tm-warm-gray" />
      </div>
    </button>
  );
}
