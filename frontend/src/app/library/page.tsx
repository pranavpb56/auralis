'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Clock, Music2, Grid3X3, List, X } from 'lucide-react';
import Link from 'next/link';
import { playlistsAPI } from '@/lib/api';
import { usePlayerStore } from '@/store';
import SongCard from '@/components/music/SongCard';
import toast from 'react-hot-toast';
import type { Song } from '@/store';

type Tab = 'playlists' | 'liked' | 'recent';

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('playlists');
  const [grid, setGrid] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const qc = useQueryClient();
  const { playSong } = usePlayerStore();

  const { data: playlists = [] } = useQuery({ queryKey: ['playlists'], queryFn: () => playlistsAPI.getAll().then(r => r.data) });
  const { data: liked = [] } = useQuery({ queryKey: ['liked-songs'], queryFn: () => playlistsAPI.getLikedSongs().then(r => r.data), enabled: tab === 'liked' });
  const { data: recent = [] } = useQuery({ queryKey: ['recently-played'], queryFn: () => playlistsAPI.getRecentlyPlayed().then(r => r.data), enabled: tab === 'recent' });

  const createMutation = useMutation({
    mutationFn: (name: string) => playlistsAPI.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['playlists'] }); setShowCreate(false); setNewName(''); toast.success('Playlist created!'); },
  });

  const likedSongs: Song[] = (liked as any[]).map((ls: any) => ls.song).filter(Boolean);
  const recentSongs: Song[] = (recent as any[]).map((h: any) => h.song).filter(Boolean);

  return (
    <div className="min-h-full px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Your Library</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setGrid(g => !g)} className="p-2 text-[#8888a8] hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            {grid ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New Playlist
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'playlists', label: 'Playlists', icon: Music2 }, { id: 'liked', label: 'Liked Songs', icon: Heart }, { id: 'recent', label: 'Recently Played', icon: Clock }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === id ? 'bg-white text-black' : 'bg-[#0d0d1a] text-[#8888a8] hover:text-white border border-[#1c1c33]'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Playlists */}
      {tab === 'playlists' && (
        (playlists as any[]).length === 0
          ? <div className="text-center py-20"><Music2 className="w-14 h-14 text-[#8888a8] mx-auto mb-4" /><p className="text-white text-xl font-semibold">No playlists yet</p><button onClick={() => setShowCreate(true)} className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-medium hover:opacity-90">Create Playlist</button></div>
          : grid
            ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(playlists as any[]).map((pl: any, i: number) => (
                  <motion.div key={pl.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/playlist/${pl.id}`} className="block glass-card glass-hover rounded-2xl p-4">
                      <div className="aspect-square rounded-xl mb-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative overflow-hidden">
                        <Music2 className="w-10 h-10 text-purple-400" />
                        {pl.is_ai_generated === 1 && <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-purple-600/80 text-white text-xs">AI</div>}
                      </div>
                      <p className="text-white text-sm font-semibold truncate">{pl.name}</p>
                      <p className="text-[#8888a8] text-xs mt-1">{pl._count?.songs || pl.song_count || 0} songs</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            : <div className="space-y-1">
                {(playlists as any[]).map((pl: any) => (
                  <Link key={pl.id} href={`/playlist/${pl.id}`} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-[#1c1c33] flex-shrink-0 flex items-center justify-center"><Music2 className="w-5 h-5 text-purple-400" /></div>
                    <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{pl.name}</p><p className="text-[#8888a8] text-sm">{pl.song_count || 0} songs</p></div>
                    {pl.is_ai_generated === 1 && <span className="text-xs text-purple-400 font-medium">AI</span>}
                  </Link>
                ))}
              </div>
      )}

      {/* Liked songs */}
      {tab === 'liked' && (
        likedSongs.length === 0
          ? <div className="text-center py-20"><Heart className="w-14 h-14 text-[#8888a8] mx-auto mb-4" /><p className="text-white text-xl font-semibold">No liked songs yet</p></div>
          : <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center"><Heart className="w-10 h-10 text-white" fill="white" /></div>
                <div><h2 className="text-2xl font-bold text-white">Liked Songs</h2><p className="text-[#8888a8]">{likedSongs.length} songs</p></div>
                <button onClick={() => likedSongs[0] && playSong(likedSongs[0], likedSongs)}
                  className="ml-auto w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
              </div>
              <div className="space-y-1">{likedSongs.map((s, i) => <SongCard key={s.id + i} song={s} queue={likedSongs} index={i + 1} showIndex compact />)}</div>
            </>
      )}

      {/* Recent */}
      {tab === 'recent' && (
        recentSongs.length === 0
          ? <div className="text-center py-20"><Clock className="w-14 h-14 text-[#8888a8] mx-auto mb-4" /><p className="text-white text-xl font-semibold">Nothing played yet</p></div>
          : <div className="space-y-1">{recentSongs.map((s, i) => <SongCard key={s.id + i} song={s} queue={recentSongs} compact />)}</div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card rounded-3xl p-8 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-[#8888a8] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-white mb-5">Create Playlist</h2>
              <input autoFocus type="text" placeholder="Playlist name" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newName.trim() && createMutation.mutate(newName.trim())}
                className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors mb-4" />
              <button onClick={() => newName.trim() && createMutation.mutate(newName.trim())} disabled={!newName.trim() || createMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
