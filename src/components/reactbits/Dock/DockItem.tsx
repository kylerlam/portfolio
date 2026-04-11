import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';

// ────────────────────────────────────────────────────────────────────────────
// Hook: macOS-style dock magnification effect
// Adopted from https://github.com/PuruVJ/macos-web & Renovamen/playground-macos
// Re-written to remove @rooks/use-raf dependency (raw requestAnimationFrame)
// ────────────────────────────────────────────────────────────────────────────

const useDockHoverAnimation = (
  mouseX: MotionValue<number | null>,
  ref: React.RefObject<HTMLDivElement | null>,
  dockSize: number,
  dockMag: number,
) => {
  const distanceLimit = dockSize * 6;
  const distanceInput = [
    -distanceLimit,
    -distanceLimit / (dockMag * 0.65),
    -distanceLimit / (dockMag * 0.85),
    0,
    distanceLimit / (dockMag * 0.85),
    distanceLimit / (dockMag * 0.65),
    distanceLimit,
  ];
  const widthOutput = [
    dockSize,
    dockSize * (dockMag * 0.55),
    dockSize * (dockMag * 0.75),
    dockSize * dockMag,
    dockSize * (dockMag * 0.75),
    dockSize * (dockMag * 0.55),
    dockSize,
  ];
  const beyondTheDistanceLimit = distanceLimit + 1;

  const distance = useMotionValue(beyondTheDistanceLimit);
  const widthPX = useSpring(
    useTransform(distance, distanceInput, widthOutput),
    { stiffness: 1700, damping: 90 },
  );

  // Replace @rooks/use-raf with native requestAnimationFrame
  useEffect(() => {
    let rafId: number;

    const update = () => {
      const el = ref.current;
      const mouseXVal = mouseX.get();

      if (el && mouseXVal !== null) {
        const rect = el.getBoundingClientRect();
        const imgCenterX = rect.left + rect.width / 2;
        const distanceDelta = mouseXVal - imgCenterX;
        distance.set(distanceDelta);
      } else {
        distance.set(beyondTheDistanceLimit);
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [mouseX, ref, distance, beyondTheDistanceLimit]);

  return { widthPX };
};

// ────────────────────────────────────────────────────────────────────────────
// DockItem Component
// ────────────────────────────────────────────────────────────────────────────

export interface DockItemConfig {
  /** Unique identifier */
  id: string;
  /** Display label shown in tooltip */
  label: string;
  /** React node for the icon (e.g. Lucide icon) */
  icon: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** External link — if set, renders as <a> */
  href?: string;
  /** Show active indicator dot */
  isActive?: boolean;
}

interface DockItemInternalProps extends DockItemConfig {
  mouseX: MotionValue<number | null>;
  dockSize: number;
  dockMag: number;
}

export default function DockItem({
  id,
  label,
  icon,
  onClick,
  href,
  isActive = false,
  mouseX,
  dockSize,
  dockMag,
}: DockItemInternalProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { widthPX } = useDockHoverAnimation(mouseX, itemRef, dockSize, dockMag);

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleClick = useCallback(() => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  }, [href, onClick]);

  return (
    <li
      id={`dock-${id}`}
      className="dock-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="dock-tooltip"
            initial={{ opacity: 0, y: 4, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 4, x: '-50%' }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon wrapper */}
      <motion.div
        ref={itemRef}
        className="dock-icon-wrapper"
        style={
          isMobile
            ? { width: `${dockSize}px`, height: `${dockSize}px` }
            : { width: widthPX, height: widthPX, willChange: 'width, height' }
        }
      >
        {icon}
      </motion.div>

      {/* Active indicator dot */}
      <div className={`dock-active-dot ${isActive ? 'visible' : 'invisible'}`} />
    </li>
  );
}
