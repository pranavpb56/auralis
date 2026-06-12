'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, usePlayerStore } from '@/store';
import Sidebar from '@/components/layout/Sidebar';
import Player from '@/components/player/Player';
import FullscreenPlayer from '@/components/player/FullscreenPlayer';
import { Home, Search, Library, Bot, BarChart3 } from 'lucide-react';

const MOBILE_NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/ai', icon: Bot, label: 'AI' },
  { href: '/analytics', icon: BarChart3, label: 'Wrapped' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuthStore();
  const { isFullscreen, currentSong } = usePlayerStore();

  useEffect(() => {
    if (!token || !user) router.push('/auth/login');
  }, [token, user]);

  if (!user) return null;

  const active = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-[#07070f] overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(var(--player-h))',
        } as React.CSSProperties}
      >
        {/* Mobile top header */}
        <div className="md:hidden flex items-center justify-between px-5 pt-safe-top pb-3 pt-4 sticky top-0 z-30 bg-[#07070f]/90 backdrop-blur-xl border-b border-[#1c1c33]/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Auralis
            </span>
          </Link>
          <Link href={`/profile/${user.username}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {(user.display_name || user.username)?.[0]?.toUpperCase()}
            </div>
          </Link>
        </div>

        {children}

        {/* Bottom spacing for mobile nav + mini player */}
        <div className="md:hidden" style={{ height: 'calc(var(--mobile-nav-h) + var(--mobile-player-h) + 16px)' }} />
      </main>

      {/* Player always mounts so YouTube API loads early */}
      <Player />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-xl border-t border-[#1c1c33]"
        style={{ height: 'var(--mobile-nav-h)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex h-full items-center">
          {MOBILE_NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${active(href) ? 'text-purple-400' : 'text-[#8888a8]'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {active(href) && <div className="w-1 h-1 rounded-full bg-purple-400 mt-0.5" />}
            </Link>
          ))}
        </div>
      </nav>

      {isFullscreen && <FullscreenPlayer />}
    </div>
  );
}
