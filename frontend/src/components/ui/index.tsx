import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-white text-xl font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-[#7070a0] text-sm mt-1">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-[#7070a0] hover:text-violet-400 transition-colors text-sm font-medium group">
          See all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-3 space-y-3">
      <div className="skeleton w-full aspect-square rounded-xl" />
      <div className="skeleton h-3.5 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-2/3 rounded-lg" />
        <div className="skeleton h-3 w-1/3 rounded-lg" />
      </div>
      <div className="skeleton h-3 w-8 rounded" />
    </div>
  );
}
