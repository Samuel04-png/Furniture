import { useEffect, useState } from 'react';
import { MessageCircle, MessageSquareMore, MessagesSquare, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ByteBerryWatermark from './ByteBerryWatermark';
import { cn, DEFAULT_WHATSAPP_NUMBER, normalizePhoneNumber, sanitizeSocialHandle } from '../lib/utils';
import { useTailoredStore } from '../store/useTailoredStore';

// Update this placeholder when the final Facebook Messenger page handle is confirmed.
const FACEBOOK_PAGE_HANDLE = 'tailored.manor';

export default function GlobalFloatingUI() {
  const location = useLocation();
  const companySettings = useTailoredStore((state) => state.companySettings);
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');
  const whatsappNumber = normalizePhoneNumber(companySettings.whatsappNumber || DEFAULT_WHATSAPP_NUMBER) || DEFAULT_WHATSAPP_NUMBER;
  const facebookHandle = sanitizeSocialHandle(companySettings.socialHandles.facebook || FACEBOOK_PAGE_HANDLE) || FACEBOOK_PAGE_HANDLE;

  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  if (isAdmin) {
    return null;
  }

  return (
    <>
      <ByteBerryWatermark className="bottom-3 left-4" />

      <div
        className="fixed bottom-6 right-4 z-[1000] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div
          className={cn(
            'flex flex-col items-end gap-3 transition-all duration-300 ease-out',
            isExpanded ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
          )}
        >
          <a
            href={`https://m.me/${facebookHandle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 font-dm text-[11px] font-semibold uppercase tracking-[0.16em] text-tm-obsidian shadow-[0_18px_45px_rgba(12,12,12,0.14)] transition duration-200 ease-out hover:-translate-y-[2px]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0084FF] text-white">
              <MessageSquareMore className="h-4 w-4" />
            </span>
            <span>Message on Facebook</span>
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 font-dm text-[11px] font-semibold uppercase tracking-[0.16em] text-tm-obsidian shadow-[0_18px_45px_rgba(12,12,12,0.14)] transition duration-200 ease-out hover:-translate-y-[2px]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span>WhatsApp Us</span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Close contact options' : 'Open contact options'}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-tm-obsidian text-tm-cream shadow-[0_22px_48px_rgba(12,12,12,0.28)] transition duration-200 ease-out hover:scale-[1.04]"
        >
          {isExpanded ? <X className="h-5 w-5" /> : <MessagesSquare className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}
