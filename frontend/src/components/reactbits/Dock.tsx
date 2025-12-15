import React from "react";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface DockProps {
  items: {
    id: string;
    icon: LucideIcon;
    label: string;
    onClick: () => void;
  }[];
  activeId: string;
  className?: string;
}

export const Dock = ({ items, activeId, className = "" }: DockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageY)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`mx-auto flex h-full w-16 flex-col items-center gap-4 rounded-2xl bg-black/20 px-2 py-4 backdrop-blur-xl ${className}`}
    >
      {items.map((item) => (
        <DockIcon
          key={item.id}
          mouseX={mouseX}
          icon={item.icon}
          label={item.label}
          isActive={activeId === item.id}
          onClick={item.onClick}
        />
      ))}
    </motion.div>
  );
};

function DockIcon({
  mouseX,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  mouseX: MotionValue;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      onClick={onClick}
      className={`group relative flex aspect-square cursor-pointer items-center justify-center rounded-full transition-colors ${
        isActive ? "bg-purple-500 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white"
      }`}
    >
      <Icon className="h-1/2 w-1/2" />
      <span className="absolute left-full ml-4 hidden rounded-md bg-black/80 px-2 py-1 text-xs text-white backdrop-blur-sm group-hover:block">
        {label}
      </span>
    </motion.div>
  );
}
