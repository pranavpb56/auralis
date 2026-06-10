'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic2, Disc3 } from 'lucide-react';
import { searchAPI, aiAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import SongCard from '@/components/music/SongCard';
import { SectionHeader, SkeletonCard } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import type { Song } from '@/store';

const GENRES = [
  { name: 'Bollywood', color: 'from-purple-600 to-fuchsia-700', emoji: '🎬' },
  { name: 'Telugu', color: 'from-green-600 to-teal-700', emoji: '🌿' },
  { name: 'Pop', color: 'from-pink-600 to-rose-700', emoji: '🎤' },
  { name: 'Hip Hop', color: 'from-yellow-600 to-orange-700', emoji: '🎧' },
  { name: 'Electronic', color: 'from-blue-600 to-indigo-700', emoji: '⚡' },
  { name: 'Rock', color: 'from-red-700 to-rose-900', emoji: '🎸' },
  { name: 'Lo-fi', color: 'from-slate-600 to-slate-800', emoji: '🌙' },
  { name: 'Jazz', color: 'from-amber-700 to-yellow-800', emoji: '🎷' },
  { name: 'Classical', color: 'from-stone-600 to-stone-800', emoji: '🎻' },
  { name: 'K-Pop', color: 'from-cyan-500 to-blue-600', emoji: '✨' },
  { name: 'Tamil', color: 'from-orange-600 to-red-700', emoji: '🌺' },
  { name: 'R&B', color: 'from-violet-600 to-purple-800', emoji: '💜' },
];

const TABS = ['All', 'Songs', 'Artists', 'Albums'];

export default function SearchPage() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [tab, setTab] = useState('All');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const mood = params.get('mood') || '';
  const dq = useDebounce(query, 400);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', dq, tab],
    queryFn: async () => {
      if (!dq.trim()) return null;
      if (tab === 'Songs') return { songs: (await searchAPI.songs(dq)).data, artists: [], albums: [] };
      if (tab === 'Artists') return { songs: [], artists: (await searchAPI.artists(dq)).data, albums: [] };
      if (tab === 'Albums') return { songs: [], artists: [], albums: (await searchAPI.albums(dq)).data };
      return (await searchAPI.all(dq)).data;
    },
    enabled: !!dq.trim(),
    staleTime: 60000,
  });

  const { data: moodData } = useQuery({
    queryKey: ['mood', mood],
    queryFn: () => aiAPI.mood(mood).then(r => r.data),
    enabled: !!mood && !query,
    staleTime: 300000,
  });

  useEffect(() => {
    if (dq.length < 2) { setSuggestions([]); return; }
    searchAPI.suggest(dq).then(r => setSuggestions(r.data || [])).catch(() => {});
  }, [dq]);

  const songs: Song[] = results?.songs || [];
  const artists: any[] = results?.artists || [];
  const albums: any[] = results?.albums || [];

  return (
    <div className="min-h-full px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>Search</h1>

      {/* Search input */}
      <div className="relative max-w-2xl mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8888a8]" />
        <input type="text" placeholder="Search songs, artists, albums..." value={query}
          onChange={e => { setQuery(e.target.value); setShowSugg(true); }}
          onFocus={() => setShowSugg(true)} onBlur={() => setTimeout(() => setShowSugg(false), 200)}
          className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-2xl px-5 py-4 pl-12 pr-12 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-base" />
        {query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8888a8] hover:text-white transition-colors"><X className="w-5 h-5" /></button>}

        <AnimatePresence>
          {showSugg && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl overflow-hidden z-30">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setQuery(s); setShowSugg(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-[#8888a8] hover:text-white hover:bg-white/5 transition-colors text-sm">
                  <Search className="w-4 h-4 flex-shrink-0" />{s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-white text-black' : 'bg-[#0d0d1a] text-[#8888a8] hover:text-white border border-[#1c1c33]'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Mood results */}
      {!query && mood && moodData?.songs?.length > 0 && (
        <section className="mb-10">
          <SectionHeader title={`${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes`} subtitle="Music that matches your mood" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {moodData.songs.slice(0, 8).map((song: Song, i: number) => (
              <SongCard key={song.id + i} song={song} queue={moodData.songs} />
            ))}
          </div>
        </section>
      )}

      {/* Search results */}
      {query && (
        <div className="space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <>
              {songs.length > 0 && (tab === 'All' || tab === 'Songs') && (
                <section>
                  <SectionHeader title="Songs" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {songs.slice(0, 12).map((song, i) => (
                      <motion.div key={song.id + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <SongCard song={song} queue={songs} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
              {artists.length > 0 && (tab === 'All' || tab === 'Artists') && (
                <section>
                  <SectionHeader title="Artists" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {artists.slice(0, 6).map((a, i) => (
                      <div key={a.id + i} className="glass-card glass-hover rounded-2xl p-4 text-center cursor-pointer">
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                          <Mic2 className="w-7 h-7 text-purple-400" />
                        </div>
                        <p className="text-white text-sm font-medium truncate">{a.name}</p>
                        <p className="text-[#8888a8] text-xs mt-0.5">Artist</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {albums.length > 0 && (tab === 'All' || tab === 'Albums') && (
                <section>
                  <SectionHeader title="Albums" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {albums.slice(0, 6).map((a, i) => (
                      <div key={a.id + i} className="glass-card glass-hover rounded-2xl p-4 cursor-pointer">
                        <div className="aspect-square rounded-xl mb-3 overflow-hidden bg-[#1c1c33] flex items-center justify-center">
                          {a.coverUrl ? <img src={a.coverUrl} alt={a.title} className="w-full h-full object-cover" /> : <Disc3 className="w-8 h-8 text-[#8888a8]" />}
                        </div>
                        <p className="text-white text-sm font-medium truncate">{a.title}</p>
                        <p className="text-[#8888a8] text-xs truncate mt-0.5">{a.artist}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {songs.length === 0 && artists.length === 0 && albums.length === 0 && (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-[#8888a8] mx-auto mb-4" />
                  <p className="text-white text-xl font-semibold">No results for "{query}"</p>
                  <p className="text-[#8888a8] mt-2">Try different keywords</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Browse genres */}
      {!query && !mood && (
        <section>
          <SectionHeader title="Browse by Genre" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {GENRES.map((g, i) => (
              <motion.button key={g.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => setQuery(g.name)}
                className={`h-20 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-between px-4 hover:scale-105 transition-transform`}>
                <span className="text-white font-semibold text-sm">{g.name}</span>
                <span className="text-2xl">{g.emoji}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
