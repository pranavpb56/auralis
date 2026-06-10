'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, Plus } from 'lucide-react';
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

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group ${isCurrent ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}
        onClick={handlePlay} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {showIndex && (
          <div className="w-5 text-center flex-shrink-0">
            {hovered || isCurrent
              ? isCurrentPlaying ? <Pause className="w-3.5 h-3.5 text-purple-400 mx-auto" /> : <Play className="w-3.5 h-3.5 text-white mx-auto" />
              : <span className={`text-xs ${isCurrent ? 'text-purple-400' : 'text-[#8888a8]'}`}>{index}</span>}
          </div>
        )}
        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-[#1c1c33]">
          {song.coverUrl
            ? <Image src={song.coverUrl} alt={song.title} width={40} height={40} className="object-cover" unoptimized />
            : <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xs font-bold text-purple-300">{song.title?.[0]}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{song.title}</p>
          <p className="text-[#8888a8] text-xs truncate">{song.artist}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleLike} className={`transition-colors ${liked ? 'text-pink-500' : 'text-[#8888a8] hover:text-white'}`}>
            <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <span className="text-[#8888a8] text-xs flex-shrink-0 ml-1">{fmt(song.duration)}</span>
      </div>
    );
  }

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}
      className="group relative glass-card rounded-2xl p-4 cursor-pointer overflow-hidden"
      onClick={handlePlay} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-[#1c1c33]">
        {song.coverUrl
          ? <Image src={song.coverUrl} alt={song.title} fill className="object-cover" unoptimized />
          : <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-3xl font-bold text-purple-300">{song.title?.[0]}</div>}
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={hovered || isCurrent ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
          onClick={e => { e.stopPropagation(); handlePlay(); }}>
          {isCurrentPlaying ? <Pause className="w-4 h-4 text-white" fill="white" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />}
        </motion.button>
        {isCurrent && !hovered && (
          <div className="absolute bottom-2 right-2 flex items-end gap-0.5 p-2">
            {[1,2,3].map(i => <div key={i} className="waveform-bar" style={{ height:'7px', animationDelay:`${i*.1}s` }} />)}
          </div>
        )}
      </div>
      <div className="relative">
        <p className={`font-medium text-sm truncate ${isCurrent ? 'text-purple-400' : 'text-white'}`}>{song.title}</p>
        <p className="text-[#8888a8] text-xs truncate mt-0.5">{song.artist}</p>
        {song.album && <p className="text-[#3a3a58] text-xs truncate mt-0.5">{song.album}</p>}
      </div>
      <button onClick={handleLike}
        className={`absolute top-3 right-3 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all ${liked ? 'text-pink-500' : 'text-white/70 hover:text-white'}`}>
        <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
      </button>
    </motion.div>
  );
}
