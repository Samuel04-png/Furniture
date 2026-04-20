export const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Collections', href: '/collections' },
  { label: 'Materials', href: '/materials' },
  { label: 'Configure', href: '/configure' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;
