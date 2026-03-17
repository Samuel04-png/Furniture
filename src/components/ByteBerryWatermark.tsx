import { cn } from '../lib/utils';

export default function ByteBerryWatermark({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none fixed z-[998]', className)}>
      <a
        href="https://byteandberry.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit Byte and Berry"
        className="pointer-events-auto inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.06] bg-black/[0.18] px-3 font-dm text-[8px] uppercase tracking-[0.18em] text-white/[0.28] backdrop-blur-sm transition duration-300 hover:bg-black/[0.32] hover:text-white/[0.5]"
      >
        <span className="opacity-60">✦</span>
        made by Byte&Berry
      </a>
    </div>
  );
}
