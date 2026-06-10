'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, TrendingUp } from 'lucide-react';
import { searchAPI, aiAPI, playlistsAPI } from '@/lib/api';
import { useAuthStore, usePlayerStore } from '@/store';
import SongCard from '@/components/music/SongCard';
import { SectionHeader, SkeletonCard } from '@/components/ui';
import type { Song } from '@/store';

const MOODS = [
  { id: 'happy', label: '😊 Happy', bg: 'from-yellow-500/25 to-orange-500/20', border: 'border-yellow-500/20' },
  { id: 'chill', label: '🌊 Chill', bg: 'from-blue-500/25 to-cyan-500/20', border: 'border-blue-500/20' },
  { id: 'energetic', label: '⚡ Energetic', bg: 'from-red-500/25 to-pink-500/20', border: 'border-red-500/20' },
  { id: 'focus', label: '🎯 Focus', bg: 'from-green-500/25 to-teal-500/20', border: 'border-green-500/20' },
  { id: 'romantic', label: '💕 Romantic', bg: 'from-pink-500/25 to-rose-500/20', border: 'border-pink-500/20' },
  { id: 'party', label: '🎉 Party', bg: 'from-purple-500/25 to-violet-500/20', border: 'border-purple-500/20' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
      {/* Header */}
      <div className="relative px-8 pt-8 pb-8 overflow-hidden">
        <div className="absolute inset-0 mesh-bg" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <p className="text-[#8888a8] text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-4xl font-bold text-white mt-1" style={{ fontFamily: 'Georgia, serif' }}>
            {greeting}, <span className="gradient-text">{(user?.display_name || user?.username || 'there').split(' ')[0]}</span>
          </h1>
          <p className="text-[#8888a8] mt-2">What are you listening to today?</p>
        </motion.div>
      </div>

      <div className="px-8 space-y-10 pb-10">
        {/* Mood pills */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader title="Pick your mood" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {MOODS.map(m => (
              <Link key={m.id} href={`/search?mood=${m.id}`}
                className={`glass-card glass-hover rounded-2xl p-3 text-center border ${m.border} bg-gradient-to-br ${m.bg}`}>
                <span className="text-sm font-medium text-white">{m.label}</span>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Quick links */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/ai" className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:border-purple-500/40 transition-all border border-[#1c1c33]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold">AI Playlist Generator</p>
                <p className="text-[#8888a8] text-sm">Describe your vibe, get a playlist instantly</p>
              </div>
            </Link>
            <Link href="/analytics" className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:border-yellow-500/40 transition-all border border-[#1c1c33]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-600/30 to-orange-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Your Wrapped</p>
                <p className="text-[#8888a8] text-sm">See your listening stats & top songs</p>
              </div>
            </Link>
          </div>
        </motion.section>

        {/* Recently played */}
        {recentSongs.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SectionHeader title="Recently Played" href="/library?tab=recent" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {recentSongs.map((song, i) => <SongCard key={song.id + i} song={song} queue={recentSongs} compact />)}
            </div>
          </motion.section>
        )}

        {/* Personalized */}
        {feedSongs.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SectionHeader title={feed?.basedOn ? `Because you like ${feed.basedOn}` : 'Recommended for You'} subtitle="Curated by your taste" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {feedSongs.map((song, i) => (
                <motion.div key={song.id + i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <SongCard song={song} queue={feedSongs} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trending */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionHeader title="Trending Now" subtitle="What everyone's listening to" />
          {isLoading
            ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {trendingSongs.map((song, i) => (
                  <motion.div key={song.id + i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                    <SongCard song={song} queue={trendingSongs} />
                  </motion.div>
                ))}
              </div>
            )}
        </motion.section>

        {/* Genre sections */}
        {trending?.genres?.map((genre: any, gi: number) =>
          genre.songs?.length > 0 && (
            <motion.section key={genre.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + gi * 0.05 }}>
              <SectionHeader title={genre.name} href={`/search?q=${encodeURIComponent(genre.name)}`} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
