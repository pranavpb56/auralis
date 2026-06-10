'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, Library, Bot, BarChart3, Settings, ChevronLeft, ChevronRight, LogOut, Music2, Heart, Clock, Plus } from 'lucide-react';
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
    <motion.aside animate={{ width: col ? 64 : 220 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-[#0d0d1a] border-r border-[#1c1c33] flex-shrink-0 overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center ${col ? 'justify-center' : 'justify-between'} px-4 py-5 border-b border-[#1c1c33]`}>
        {!col && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Auralis</span>
          </Link>
        )}
        {col && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Music2 className="w-4 h-4 text-white" /></div>}
        {!col && (
          <button onClick={() => setSidebarCollapsed(!col)} className="text-[#8888a8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5">
        {/* Nav */}
        <div className="px-3 space-y-0.5">
          {!col && <p className="text-[#8888a8] text-xs font-semibold uppercase tracking-wider mb-2 px-2">Menu</p>}
          {NAV.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={active(href)} col={col} />
          ))}
        </div>
        <div className="px-3 space-y-0.5">
          {!col && <p className="text-[#8888a8] text-xs font-semibold uppercase tracking-wider mb-2 px-2">Discover</p>}
          {EXTRA.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={Icon} label={label} active={active(href)} col={col} />
          ))}
        </div>

        {/* Playlists list */}
        {!col && (
          <div className="px-3">
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[#8888a8] text-xs font-semibold uppercase tracking-wider">Playlists</p>
              <Link href="/library" className="text-[#8888a8] hover:text-white transition-colors"><Plus className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="space-y-0.5 max-h-44 overflow-y-auto">
              {(playlists as any[]).slice(0, 10).map((pl: any) => (
                <Link key={pl.id} href={`/playlist/${pl.id}`}
                  className={`block px-2 py-1.5 rounded-lg text-xs truncate transition-colors ${pathname === `/playlist/${pl.id}` ? 'text-white bg-white/5' : 'text-[#8888a8] hover:text-white'}`}>
                  {pl.name}
                </Link>
              ))}
              {(playlists as any[]).length === 0 && <p className="text-[#3a3a58] text-xs px-2 py-1">No playlists yet</p>}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-[#1c1c33] p-3 space-y-1">
        {!col && user && (
          <Link href={`/profile/${user.username}`} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(user.display_name || user.username)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.display_name || user.username}</p>
              <p className="text-[#8888a8] text-xs truncate">@{user.username}</p>
            </div>
          </Link>
        )}
        <NavItem href="/settings" icon={Settings} label="Settings" active={active('/settings')} col={col} />
        <button onClick={() => { logout(); router.push('/auth/login'); toast.success('Logged out'); }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8888a8] hover:text-white hover:bg-white/5 transition-all w-full ${col ? 'justify-center' : ''}`}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!col && <span className="text-sm">Log out</span>}
        </button>
        {col && (
          <button onClick={() => setSidebarCollapsed(false)} className="flex justify-center w-full py-2 text-[#8888a8] hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.aside>
  );
}

function NavItem({ href, icon: Icon, label, active, col }: any) {
  return (
    <Link href={href} title={col ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-purple-500/15 text-white' : 'text-[#8888a8] hover:text-white hover:bg-white/5'} ${col ? 'justify-center' : ''}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-400' : ''}`} />
      {!col && <span className="text-sm font-medium">{label}</span>}
      {active && !col && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
    </Link>
  );
}
