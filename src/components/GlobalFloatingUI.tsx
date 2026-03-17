import { MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ByteBerryWatermark from './ByteBerryWatermark';

function RoomPlanIcon() {
  return (
    <span className="grid h-4 w-4 grid-cols-2 gap-[2px]" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} className="bg-tm-obsidian" />
      ))}
    </span>
  );
}

export default function GlobalFloatingUI() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const showVisualiserPill = !isAdmin && location.pathname !== '/' && !location.pathname.startsWith('/visualise');

  if (isAdmin) {
    return null;
  }

  return (
    <>
      {showVisualiserPill ? (
        <Link
          to="/visualise"
          className="fixed bottom-8 left-6 z-[999] inline-flex h-11 items-center gap-3 bg-tm-gold px-5 font-dm text-[11px] font-semibold uppercase tracking-[0.15em] text-tm-obsidian transition duration-200 ease-out hover:-translate-y-[2px] hover:bg-tm-gold-light md:left-8"
        >
          <RoomPlanIcon />
          Visualise Your Space
        </Link>
      ) : null}

      <ByteBerryWatermark className="bottom-3 left-4" />

      <a
        href="https://wa.me/260981504322"
        target="_blank"
        rel="noreferrer"
        aria-label="Contact Tailored Manor on WhatsApp"
        className="fixed bottom-8 right-8 z-[1000] inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white transition duration-200 ease-out hover:scale-[1.08]"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
}
