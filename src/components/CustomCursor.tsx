import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer:fine)');
    setEnabled(media.matches);

    const handleMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest('a, button, input, textarea, select, [data-cursor="interactive"]');
      setActive(Boolean(interactive));
    };

    const handleMediaChange = () => setEnabled(media.matches);
    media.addEventListener('change', handleMediaChange);
    window.addEventListener('mousemove', handleMove);

    return () => {
      media.removeEventListener('change', handleMediaChange);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-3 w-3 rounded-full bg-tm-obsidian mix-blend-difference md:block"
        animate={{ x: position.x - 6, y: position.y - 6 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.2 }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[119] hidden rounded-full border border-tm-gold/70 md:block"
        animate={{
          x: position.x - (active ? 22 : 16),
          y: position.y - (active ? 22 : 16),
          width: active ? 44 : 32,
          height: active ? 44 : 32,
          opacity: active ? 1 : 0.5,
        }}
        transition={{ type: 'spring', stiffness: 340, damping: 26, mass: 0.45 }}
      />
    </>
  );
}
