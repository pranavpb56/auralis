'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/store';
import { playlistsAPI } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Song } from '@/store';

interface Props {
  song: Song;
  queue?: Song[];
  index?: number;
  showIndex?: boolean;
  compact?: boolean;
  onLike?: () => void;
}

export default function SongCard({ song, queue, index, showIndex, compact, onLike }: Props) {
  const { currentSong, isPlaying, playSong, pauseResume } = usePlayerStore();
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isCurrentPlaying = isCurrent && isPlaying;

  const handlePlay = () => {
    if (isCurrent) { pauseResume(); return; }
    playSong(song, queue || [song]);
    playlistsAPI.recordPlay(song).catch(() => {});
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data } = await playlistsAPI.likeSong(song);
      setLiked(data.liked);
      toast.success(data.liked ? '❤️ Liked!' : 'Removed');
      onLike?.();
    } catch { toast.error('Please log in'); }
  };

  const fmt = (s?: number) => !s ? '—' : `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Compact row (list view) ──────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all group ${isCurrent ? 'bg-violet-500/10 border border-violet-500/15' : 'hover:bg-white/[0.04] border border-transparent'}`}
        onClick={handlePlay}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {showIndex && (
          <div className="w-5 text-center flex-shrink-0">
            {hovered || isCurrent
              ? isCurrentPlaying
                ? <Pause className="w-3.5 h-3.5 text-violet-400 mx-auto" />
                : <Play className="w-3.5 h-3.5 text-white mx-auto" />
              : <span className={`text-xs tabular-nums ${isCurrent ? 'text-violet-400' : 'text-[#7070a0]'}`}>{index}</span>
            }
          </div>
        )}

        <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-[#161628] relative">
          {song.coverUrl
            ? <Image src={song.coverUrl} alt={song.title} width={40} height={40} className="object-cover" unoptimized />
            : <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-xs font-bold text-violet-300 font-display">{song.title?.[0]}</div>
          }
          {isCurrent && isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
              {[1,2,3].map(i => <div key={i} className="waveform-bar" style={{ height: '6px', animationDelay: `${i*.12}s` }} />)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate leading-tight ${isCurrent ? 'text-violet-400' : 'text-white'}`}>{song.title}</p>
          <p className="text-[#7070a0] text-xs truncate mt-0.5">{song.artist}</p>
        </div>

        <div className={`flex items-center gap-2 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={handleLike} className={`transition-colors p-1 rounded-full hover:bg-white/5 ${liked ? 'text-pink-500' : 'text-[#7070a0] hover:text-white'}`}>
            <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <span className="text-[#7070a0] text-xs flex-shrink-0 tabular-nums">{fmt(song.duration)}</span>
      </div>
    );
  }

  // ── Grid card ────────────────────────────────────────────────────────────
  return (
    <div
      className="group relative cursor-pointer song-card-lift"
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`rounded-2xl p-3 transition-all ${isCurrent ? 'bg-violet-500/10 border border-violet-500/18' : 'bg-[var(--bg-surface)] border border-[var(--border)] group-hover:bg-[var(--bg-elevated)] group-hover:border-[var(--border-hover)]'}`}>
        {/* Album art */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-[#161628]">
          {song.coverUrl
            ? <Image src={song.coverUrl} alt={song.title} fill className="object-cover" unoptimized />
            : <div className="w-full h-full bg-gradient-to-br from-violet-600/25 to-pink-600/25 flex items-center justify-center text-3xl font-bold text-violet-300 font-display">{song.title?.[0]}</div>
          }

          {/* Play button overlay */}
          <motion.div
            initial={false}
            animate={hovered || isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/30 flex items-end justify-end p-2.5"
          >
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-900/50">
              {isCurrentPlaying
                ? <Pause className="w-4 h-4 text-white" fill="white" />
                : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              }
            </div>
          </motion.div>

          {/* Waveform when playing and not hovered */}
          {isCurrent && !hovered && (
            <div className="absolute bottom-2.5 right-2.5 flex items-end gap-0.5 p-2 rounded-full bg-black/40">
              {[1,2,3].map(i => <div key={i} className="waveform-bar" style={{ height: '7px', animationDelay: `${i*.12}s` }} />)}
            </div>
          )}

          {/* Like button */}
          <button
            onClick={handleLike}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-sm transition-all active:scale-90 ${liked ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-100 text-white/70 hover:text-white'}`}
          >
            <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Text */}
        <div>
          <p className={`font-semibold text-sm truncate leading-tight ${isCurrent ? 'text-violet-400' : 'text-white'}`}>{song.title}</p>
          <p className="text-[#7070a0] text-xs truncate mt-1">{song.artist}</p>
          {song.album && <p className="text-[#3a3a5a] text-xs truncate mt-0.5">{song.album}</p>}
        </div>
      </div>
    </div>
  );
}
