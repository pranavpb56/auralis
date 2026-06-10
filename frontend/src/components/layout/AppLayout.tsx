'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePlayerStore } from '@/store';
import Sidebar from '@/components/layout/Sidebar';
import Player from '@/components/player/Player';
import FullscreenPlayer from '@/components/player/FullscreenPlayer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { isFullscreen } = usePlayerStore();

  useEffect(() => {
    if (!token || !user) router.push('/auth/login');
  }, [token, user]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#07070f] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'var(--player-h)' }}>
        {children}
      </main>
      {/* Player always mounts so YouTube API loads early */}
      <Player />
      {isFullscreen && <FullscreenPlayer />}
    </div>
  );
}
