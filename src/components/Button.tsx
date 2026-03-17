import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

type Variant = 'primary' | 'secondary' | 'minimal';

type SharedProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
};

type LinkButtonProps = SharedProps & {
  to: string;
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className' | 'children'>;

type ExternalButtonProps = SharedProps & {
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>;

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

type ButtonProps = LinkButtonProps | ExternalButtonProps | NativeButtonProps;

const buttonStyles: Record<Variant, string> = {
  primary:
    "relative isolate h-[56px] bg-gradient-to-tr from-tm-gold to-tm-gold-light px-9 font-dm text-[12px] font-bold uppercase tracking-[0.24em] text-tm-obsidian shadow-[0_12px_32px_rgba(184,147,90,0.18)] after:pointer-events-none after:absolute after:inset-[1px] after:border after:border-white/20 after:content-[''] hover:-translate-y-[3px] hover:shadow-[0_20px_48px_rgba(184,147,90,0.28)] active:translate-y-0 active:scale-[0.98] tm-btn-glow",
  secondary:
    "relative isolate h-[56px] border border-tm-gold/40 bg-transparent px-9 font-dm text-[12px] font-bold uppercase tracking-[0.24em] text-tm-cream backdrop-blur-sm after:pointer-events-none after:absolute after:inset-[1px] after:border after:border-white/5 after:content-[''] hover:-translate-y-[3px] hover:border-tm-gold hover:bg-tm-gold/5 active:translate-y-0 active:scale-[0.98]",
  minimal:
    "relative isolate h-12 border border-white/10 bg-white/5 px-6 font-dm text-[11px] font-bold uppercase tracking-[0.2em] text-tm-cream backdrop-blur-md hover:bg-white/10 hover:border-white/20 active:scale-[0.97]",
};

function buildClassName(props: SharedProps) {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none transition duration-200 ease-out will-change-transform',
    props.fullWidth && 'w-full',
    buttonStyles[props.variant ?? 'primary'],
    props.className,
  );
}

function ButtonContent({
  children,
  icon,
  iconPosition = 'left',
}: Pick<SharedProps, 'children' | 'icon' | 'iconPosition'>) {
  return (
    <>
      {icon && iconPosition === 'left' ? icon : null}
      <span>{children}</span>
      {icon && iconPosition === 'right' ? icon : null}
    </>
  );
}

export default function Button(props: ButtonProps) {
  if ('to' in props) {
    const {
      to,
      children,
      variant,
      className,
      icon,
      iconPosition,
      fullWidth,
      ...linkProps
    } = props;

    return (
      <Link to={to} className={buildClassName({ children, variant, className, icon, iconPosition, fullWidth })} {...linkProps}>
        <ButtonContent icon={icon} iconPosition={iconPosition}>
          {children}
        </ButtonContent>
      </Link>
    );
  }

  if ('href' in props) {
    const {
      href,
      children,
      variant,
      className,
      icon,
      iconPosition,
      fullWidth,
      ...anchorProps
    } = props;

    return (
      <a href={href} className={buildClassName({ children, variant, className, icon, iconPosition, fullWidth })} {...anchorProps}>
        <ButtonContent icon={icon} iconPosition={iconPosition}>
          {children}
        </ButtonContent>
      </a>
    );
  }

  const {
    children,
    variant,
    className,
    icon,
    iconPosition,
    fullWidth,
    type = 'button',
    ...buttonProps
  } = props;

  return (
    <button type={type} className={buildClassName({ children, variant, className, icon, iconPosition, fullWidth })} {...buttonProps}>
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </button>
  );
}
