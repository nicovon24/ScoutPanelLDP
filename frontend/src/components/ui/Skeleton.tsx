"use client";
import { motion } from "framer-motion";

// ─── Shimmer animation shared config ─────────────────────────────────────────
const shimmer = {
  animate: {
    x: ["-100%", "100%"],
  },
  transition: {
    duration: 1.6,
    ease: "linear" as const,
    repeat: Infinity,
  },
};

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Base shimmer block */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-white/[0.06] ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
          width: "60%",
        }}
        {...shimmer}
      />
    </div>
  );
}

/** Full player card skeleton matching PlayerCard dimensions */
export function PlayerCardSkeleton() {
  return (
    <div className="w-full min-h-[260px] p-[18px] flex flex-col gap-4 bg-[#0c0c0c] rounded-[20px] border border-white/[0.05]">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-14 h-5 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>

      {/* Photo + name */}
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="w-3/4 h-3" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="flex-1 h-8 rounded-lg" />
        <Skeleton className="flex-1 h-8 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
  );
}

/** Grid of player card skeletons */
export function PlayerGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Generic card with rows skeleton */
export function CardSkeleton({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`card flex flex-col gap-4 ${className}`}>
      <Skeleton className="w-1/3 h-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <Skeleton className="w-1/3 h-3" />
          <Skeleton className="w-1/4 h-3" />
        </div>
      ))}
    </div>
  );
}

/** Chart area skeleton */
export function ChartSkeleton({ height = 200, className = "" }: { height?: number; className?: string }) {
  return (
    <div className={`card flex flex-col gap-4 ${className}`}>
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}
