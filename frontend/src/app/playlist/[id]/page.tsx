'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Pause, Shuffle, Heart, Trash2, Share2, Music2, X } from 'lucide-react';
import { playlistsAPI } from '@/lib/api';
import { usePlayerStore, useAuthStore } from '@/store';
import SongCard from '@/components/music/SongCard';
import toast from 'react-hot-toast';
import type { Song } from '@/store';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { playSong, currentSong, isPlaying, pauseResume, toggleShuffle } = usePlayerStore();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistsAPI.get(id).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => playlistsAPI.delete(id),
    onSuccess: () => { toast.success('Deleted'); router.push('/library'); qc.invalidateQueries({ queryKey: ['playlists'] }); },
  });

  const removeSongMutation = useMutation({
    mutationFn: (songId: string) => playlistsAPI.removeSong(id, songId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlist', id] }),
  });

  const songs: Song[] = (playlist?.songs || []).map((ps: any) => ps.song).filter(Boolean);
  const isOwner = user?.id === playlist?.user_id;
  const isThisPlaying = songs.some(s => s.id === currentSong?.id) && isPlaying;
  const totalSecs = songs.reduce((s, sg) => s + (sg.duration || 0), 0);
  const fmtDur = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

  if (isLoading) return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex gap-8"><div className="skeleton w-48 h-48 rounded-2xl flex-shrink-0" /><div className="flex-1 space-y-4 pt-8"><div className="skeleton h-8 w-1/3 rounded" /><div className="skeleton h-12 w-2/3 rounded" /></div></div>
    </div>
  );
  if (!playlist) return <div className="p-8 text-[#8888a8]">Playlist not found</div>;

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative px-8 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/25 to-[#07070f]" />
        <div className="relative flex flex-col md:flex-row gap-8 items-end">
          <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0 flex items-center justify-center shadow-2xl relative">
            <Music2 className="w-20 h-20 text-white/40" />
            {playlist.is_ai_generated === 1 && <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/20 text-white text-xs font-medium">AI</div>}
          </div>
          <div className="pb-2">
            <p className="text-[#8888a8] text-sm uppercase tracking-wider font-semibold mb-2">{playlist.is_ai_generated === 1 ? 'AI Playlist' : 'Playlist'}</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>{playlist.name}</h1>
            {playlist.description && <p className="text-[#8888a8] mt-2 text-sm">{playlist.description}</p>}
            {playlist.ai_prompt && <p className="text-purple-400 text-sm italic mt-2">"{playlist.ai_prompt}"</p>}
            <div className="flex items-center gap-2 text-[#8888a8] text-sm mt-3">
              <span className="text-white font-medium">{playlist.display_name || playlist.username}</span>
              <span>·</span><span>{songs.length} songs</span>
              {totalSecs > 0 && <><span>·</span><span>{fmtDur(totalSecs)}</span></>}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="relative flex items-center gap-4 mt-6">
          <button onClick={() => { if (!songs.length) return; if (isThisPlaying) { pauseResume(); return; } playSong(songs[0], songs); }}
            disabled={!songs.length}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-40">
            {isThisPlaying ? <Pause className="w-6 h-6 text-white" fill="white" /> : <Play className="w-6 h-6 text-white ml-0.5" fill="white" />}
          </button>
          <button onClick={() => { if (!songs.length) return; const s = [...songs].sort(() => Math.random() - 0.5); toggleShuffle(); playSong(s[0], s); }} className="p-3 text-[#8888a8] hover:text-white transition-colors hover:scale-110"><Shuffle className="w-5 h-5" /></button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="p-3 text-[#8888a8] hover:text-white transition-colors hover:scale-110"><Share2 className="w-5 h-5" /></button>
          {isOwner && (
            <button onClick={() => { if (confirm('Delete this playlist?')) deleteMutation.mutate(); }}
              className="p-3 text-[#8888a8] hover:text-red-400 transition-colors hover:scale-110 ml-auto"><Trash2 className="w-5 h-5" /></button>
          )}
        </div>
      </div>

      {/* Songs */}
      <div className="px-8 pb-10">
        {songs.length === 0
          ? <div className="text-center py-16"><Music2 className="w-12 h-12 text-[#8888a8] mx-auto mb-4" /><p className="text-white text-lg font-semibold">No songs yet</p><p className="text-[#8888a8] mt-1">Search for songs to add</p></div>
          : <div className="space-y-1">
              {songs.map((song, i) => (
                <div key={song.id + i} className="group flex items-center">
                  <div className="flex-1"><SongCard song={song} queue={songs} index={i + 1} showIndex compact /></div>
                  {isOwner && (
                    <button onClick={() => removeSongMutation.mutate(song.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#8888a8] hover:text-red-400 mr-2"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
