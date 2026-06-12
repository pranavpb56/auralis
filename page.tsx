'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, TrendingUp, Flame } from 'lucide-react';
import { searchAPI, aiAPI, playlistsAPI } from '@/lib/api';
import { useAuthStore, usePlayerStore } from '@/store';
import SongCard from '@/components/music/SongCard';
import { SectionHeader, SkeletonCard } from '@/components/ui';
import type { Song } from '@/store';

const MOODS = [
  { id: 'happy',    label: 'Happy',    emoji: '😊', from: '#f59e0b', to: '#f97316' },
  { id: 'chill',    label: 'Chill',    emoji: '🌊', from: '#06b6d4', to: '#3b82f6' },
  { id: 'energetic',label: 'Energy',   emoji: '⚡', from: '#ef4444', to: '#ec4899' },
  { id: 'focus',    label: 'Focus',    emoji: '🎯', from: '#10b981', to: '#06b6d4' },
  { id: 'romantic', label: 'Romance',  emoji: '💕', from: '#ec4899', to: '#f43f5e' },
  { id: 'party',    label: 'Party',    emoji: '🎉', from: '#8b5cf6', to: '#ec4899' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function DashboardPage() {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.display_name || user?.username || 'there').split(' ')[0];

  const { data: trending, isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => searchAPI.trending().then(r => r.data),
    staleTime: 600000,
  });
  const { data: feed } = useQuery({
    queryKey: ['ai-feed'],
    queryFn: () => aiAPI.feed().then(r => r.data),
    staleTime: 300000,
  });
  const { data: recent } = useQuery({
    queryKey: ['recently-played'],
    queryFn: () => playlistsAPI.getRecentlyPlayed().then(r => r.data),
    staleTime: 60000,
  });

  const trendingSongs: Song[] = trending?.songs?.slice(0, 8) || [];
  const feedSongs: Song[] = feed?.songs?.slice(0, 8) || [];
  const recentSongs: Song[] = (recent || []).slice(0, 6).map((h: any) => h.song).filter(Boolean);

  return (
    <div className="min-h-full">
      {/* Hero header */}
      <div className="relative px-5 md:px-8 pt-6 md:pt-8 pb-8 overflow-hidden">
        <div className="absolute inset-0 mesh-bg pointer-events-none" />
        <motion.div {...fadeUp()} className="relative">
          <p className="text-[#7070a0] text-sm font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-1 font-display leading-tight">
            {greeting},&nbsp;<span className="gradient-text">{firstName}</span>
          </h1>
          <p className="text-[#7070a0] mt-2 text-sm">What are you listening to today?</p>
        </motion.div>
      </div>

      <div className="px-5 md:px-8 space-y-10 pb-10">

        {/* Mood picker */}
        <motion.section {...fadeUp(0.05)}>
          <SectionHeader title="Pick your mood" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {MOODS.map(m => (
              <Link key={m.id} href={`/search?mood=${m.id}`}
                className="relative overflow-hidden rounded-2xl p-3 text-center active:scale-95 transition-transform group"
                style={{ background: `linear-gradient(135deg, ${m.from}18, ${m.to}12)`, border: `1px solid ${m.from}22` }}
              >
                <div className="text-2xl mb-1">{m.emoji}</div>
                <span className="text-white text-xs font-semibold">{m.label}</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${m.from}28, ${m.to}20)` }} />
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Feature cards */}
        <motion.section {...fadeUp(0.1)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/ai"
              className="group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.08))', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-[15px]">AI Playlist</p>
                <p className="text-[#7070a0] text-xs mt-0.5">Describe your vibe, get a playlist</p>
              </div>
            </Link>
            <Link href="/analytics"
              className="group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(234,179,8,0.08))', border: '1px solid rgba(251,146,60,0.18)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-[15px]">Your Wrapped</p>
                <p className="text-[#7070a0] text-xs mt-0.5">See your top songs & listening stats</p>
              </div>
            </Link>
          </div>
        </motion.section>

        {/* Recently played */}
        {recentSongs.length > 0 && (
          <motion.section {...fadeUp(0.15)}>
            <SectionHeader title="Recently Played" href="/library?tab=recent" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {recentSongs.map((song, i) => (
                <SongCard key={song.id + i} song={song} queue={recentSongs} compact />
              ))}
            </div>
          </motion.section>
        )}

        {/* AI picks */}
        {feedSongs.length > 0 && (
          <motion.section {...fadeUp(0.2)}>
            <SectionHeader
              title={feed?.basedOn ? `Because you like ${feed.basedOn}` : 'Recommended for You'}
              subtitle="Curated by AI for your taste"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {feedSongs.map((song, i) => (
                <motion.div key={song.id + i} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <SongCard song={song} queue={feedSongs} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trending */}
        <motion.section {...fadeUp(0.25)}>
          <SectionHeader title="Trending Now" subtitle="What everyone's listening to" />
          {isLoading
            ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {trendingSongs.map((song, i) => (
                  <motion.div key={song.id + i} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                    <SongCard song={song} queue={trendingSongs} />
                  </motion.div>
                ))}
              </div>
            )}
        </motion.section>

        {/* Genre sections */}
        {trending?.genres?.map((genre: any, gi: number) =>
          genre.songs?.length > 0 && (
            <motion.section key={genre.name} {...fadeUp(0.25 + gi * 0.05)}>
              <SectionHeader title={genre.name} href={`/search?q=${encodeURIComponent(genre.name)}`} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {genre.songs.slice(0, 4).map((song: Song, i: number) => (
                  <SongCard key={song.id + i} song={song} queue={genre.songs} />
                ))}
              </div>
            </motion.section>
          )
        )}
      </div>
    </div>
  );
}
