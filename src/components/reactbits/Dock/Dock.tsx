import { useMotionValue } from 'framer-motion';
import DockItem, { type DockItemConfig } from './DockItem';

// ────────────────────────────────────────────────────────────────────────────
// Dock Component
//
// macOS-style dock with magnification hover effect.
// Extracted from https://github.com/Renovamen/playground-macos and
// re-implemented with the project's own tech stack.
//
// Usage:
//   <Dock items={[{ id: 'gh', label: 'GitHub', icon: <Github />, href: '...' }]} />
// ────────────────────────────────────────────────────────────────────────────

interface DockProps {
  /** Array of dock item configurations */
  items: DockItemConfig[];
  /** Base icon size in px (default: 50) */
  dockSize?: number;
  /** Maximum magnification multiplier (default: 2) */
  dockMag?: number;
  /** Additional class names */
  className?: string;
}

export default function Dock({
  items,
  dockSize = 50,
  dockMag = 2,
  className = '',
}: DockProps) {
  const mouseX = useMotionValue<number | null>(null);

  return (
    <div className={`dock-container ${className}`}>
      <ul
        className="dock-bar"
        onMouseMove={(e) => mouseX.set(e.nativeEvent.x)}
        onMouseLeave={() => mouseX.set(null)}
        style={{ height: `${dockSize + 15}px` }}
      >
        {items.map((item) => (
          <DockItem
            key={`dock-${item.id}`}
            {...item}
            mouseX={mouseX}
            dockSize={dockSize}
            dockMag={dockMag}
          />
        ))}
      </ul>
    </div>
  );
}
