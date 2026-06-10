import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-white text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-[#8888a8] text-sm mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[#8888a8] hover:text-white transition-colors text-sm font-medium">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="skeleton w-full aspect-square rounded-xl" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-3 w-8 rounded" />
    </div>
  );
}
