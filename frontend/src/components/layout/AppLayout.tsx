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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'var(--player-h)' }}>
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-5 py-3"
          style={{ background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold font-display">A</span>
            </div>
            <span className="text-white font-bold text-xl font-display tracking-tight">Auralis</span>
          </Link>
          <Link href={`/profile/${user.username}`} className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {(user.display_name || user.username)?.[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#080810]" />
          </Link>
        </div>

        {children}

        {/* Spacer for mobile nav + mini player */}
        <div className="md:hidden" style={{ height: 'calc(var(--mobile-nav-h) + var(--mobile-player-h) + 24px)' }} />
      </main>

      <Player />

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          height: 'var(--mobile-nav-h)',
          background: 'rgba(8,8,16,0.96)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex h-full">
          {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = active(href);
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative"
                style={{ color: isActive ? '#a78bfa' : '#7070a0' }}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-violet-400" />
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {isFullscreen && <FullscreenPlayer />}
    </div>
  );
}

// tiny inline motion div for the active indicator
  return <div className={className} />;
}
