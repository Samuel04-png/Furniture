import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Button from '../Button';
import { companySettings } from '../../data/content';
import { WordmarkLockup } from '../primitives';

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-tm-charcoal text-tm-cream">
      <div className="tm-container tm-section">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="max-w-md">
            <WordmarkLockup inverted />
            <p className="mt-10 font-dm text-[16px] leading-[1.75] text-[rgba(245,239,230,0.7)]">
              Bespoke hardwood furniture, tailored room visualisation, and end-to-end delivery for homes that want more than off-the-shelf interiors.
            </p>
            <div className="mt-10">
              <Button to="/admin" variant="minimal" icon={<ArrowUpRight className="h-4 w-4" />} iconPosition="right">
                Admin
              </Button>
            </div>
          </div>

          <FooterColumn
            title="Explore"
            links={[
              ['Collections', '/collections'],
              ['Materials', '/materials'],
              ['The Process', '/the-process'],
              ['Portfolio', '/portfolio'],
            ]}
          />
          <FooterColumn
            title="Services"
            links={[
              ['Visualise Your Space', '/visualise'],
              ['Custom Quote', '/configure'],
              ['Book Consultation', '/book-consultation'],
              ['Contact', '/contact'],
            ]}
          />
          <div>
            <div className="mb-4">
              <p className="tm-eyebrow">Visit</p>
            </div>
            <div className="space-y-3 font-dm text-[16px] leading-[1.75] text-[rgba(245,239,230,0.7)]">
              <p>{companySettings.address}</p>
              <p>{companySettings.primaryPhone}</p>
              <p>{companySettings.email}</p>
              <p>{companySettings.socialHandles.instagram}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[rgba(245,239,230,0.08)] pt-6 font-dm text-[11px] uppercase tracking-[0.18em] text-[rgba(245,239,230,0.5)] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {new Date().getFullYear()} Tailored Manor</p>
          <p>Made for conversion, consultation, and craftsmanship</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div className="mb-4">
        <p className="tm-eyebrow">{title}</p>
      </div>
      <div className="space-y-3">
        {links.map(([label, href]) => (
          <Link key={href} to={href} className="block font-dm text-[16px] leading-[1.75] text-[rgba(245,239,230,0.7)] transition hover:text-tm-gold">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
