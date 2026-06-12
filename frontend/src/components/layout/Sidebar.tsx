'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Library, Bot, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Music2, Plus } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { playlistsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/library', icon: Library, label: 'Your Library' },
];
const EXTRA = [
  { href: '/ai', icon: Bot, label: 'AI Assistant' },
  { href: '/analytics', icon: BarChart3, label: 'Your Wrapped' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed: col, setSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistsAPI.getAll().then(r => r.data),
    staleTime: 30000,
  });

  const active = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <div
      className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden transition-all duration-200"
      style={{
        width: col ? 64 : 228,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className={`flex items-center ${col ? 'justify-center' : 'justify-between'} px-4 py-5 border-b`} style={{ borderColor: 'var(--border)' }}>
        {!col && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white font-display tracking-tight">Auralis</span>
          </Link>
        )}
        {col && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg">
            <Music2 className="w-4 h-4 text-white" />
          </div>
        )}
        {!col && (
          <button onClick={() => setSidebarCollapsed(!col)} className="text-[#7070a0] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6">
        {/* Main nav */}
        <div className="px-3 space-y-0.5">
          {!col && <p className="text-[#7070a0] text-[10px] font-bold uppercase tracking-[0.1em] mb-2 px-2">Menu</p>}
          {NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={active(href)} col={col} />
          ))}
        </div>

        <div className="px-3 space-y-0.5">
          {!col && <p className="text-[#7070a0] text-[10px] font-bold uppercase tracking-[0.1em] mb-2 px-2">Discover</p>}
          {EXTRA.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={active(href)} col={col} />
          ))}
        </div>

        {/* Playlists */}
        {!col && (
          <div className="px-3">
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[#7070a0] text-[10px] font-bold uppercase tracking-[0.1em]">Playlists</p>
              <Link href="/library" className="text-[#7070a0] hover:text-violet-400 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {(playlists as any[]).slice(0, 10).map((pl: any) => (
                <Link key={pl.id} href={`/playlist/${pl.id}`}
                  className={`block px-2.5 py-1.5 rounded-xl text-xs truncate transition-all font-medium ${pathname === `/playlist/${pl.id}` ? 'text-white bg-white/6' : 'text-[#7070a0] hover:text-white hover:bg-white/4'}`}>
                  {pl.name}
                </Link>
              ))}
              {(playlists as any[]).length === 0 && (
                <p className="text-[#3a3a5a] text-xs px-2.5 py-1.5">No playlists yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t p-3 space-y-1" style={{ borderColor: 'var(--border)' }}>
        {!col && user && (
          <Link href={`/profile/${user.username}`}
            className="flex items-center gap-3 px-2.5 py-2.5 rounded-2xl hover:bg-white/5 transition-colors mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
              {(user.display_name || user.username)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.display_name || user.username}</p>
              <p className="text-[#7070a0] text-xs truncate">@{user.username}</p>
            </div>
          </Link>
        )}
        <NavItem href="/settings" icon={Settings} label="Settings" active={active('/settings')} col={col} />
        <button
          onClick={() => { logout(); router.push('/auth/login'); toast.success('Logged out'); }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#7070a0] hover:text-white hover:bg-white/5 transition-all w-full ${col ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!col && <span className="text-sm font-medium">Log out</span>}
        </button>
        {col && (
          <button onClick={() => setSidebarCollapsed(false)} className="flex justify-center w-full py-2 text-[#7070a0] hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, col }: any) {
  return (
    <Link href={href} title={col ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${active ? 'bg-violet-500/12 text-white' : 'text-[#7070a0] hover:text-white hover:bg-white/5'} ${col ? 'justify-center' : ''}`}
    >
      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-violet-400' : ''}`} />
      {!col && <span className="text-sm">{label}</span>}
      {active && !col && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
    </Link>
  );
}
