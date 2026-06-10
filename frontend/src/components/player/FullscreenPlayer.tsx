'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ChevronDown, ListMusic, Wifi
} from 'lucide-react';
import { usePlayerStore } from '@/store';
import { useState } from 'react';
import { playlistsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function Visualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end justify-center gap-0.5 h-12">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-purple-600 to-pink-400"
          animate={isPlaying
            ? { scaleY: [0.3, 1, 0.4, 0.8, 0.3], opacity: [0.5, 1, 0.6, 1, 0.5] }
            : { scaleY: 0.15, opacity: 0.3 }
          }
          transition={{ duration: 1.1, repeat: Infinity, delay: (i * 0.05) % 1.1, ease: 'easeInOut' }}
          style={{ height: `${14 + Math.sin(i * 0.6) * 10}px`, transformOrigin: 'bottom' }}
        />
      ))}
    </div>
  );
}

export default function FullscreenPlayer() {
  const {
    currentSong, isPlaying, volume, isMuted, progress, duration,
    isRepeat, isShuffle, queue, ytVideoId, ytReady,
    pauseResume, skipNext, skipPrev, setVolume, toggleMute,
    setProgress, toggleRepeat, toggleShuffle, toggleFullscreen,
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const val = pct * (duration || 0);
    setProgress(val);
    if ((window as any)._auralisSeek) (window as any)._auralisSeek(val);
  };

  const handleLike = async () => {
    if (!currentSong) return;
    try {
      const { data } = await playlistsAPI.likeSong(currentSong);
      setIsLiked(data.liked);
      toast.success(data.liked ? '❤️ Liked!' : 'Removed');
    } catch {}
  };

  const dur = duration || currentSong?.duration || 0;
  const pct = dur > 0 ? Math.min((progress / dur) * 100, 100) : 0;

  if (!currentSong) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex overflow-hidden"
    >
      {/* Blurred background */}
      {currentSong.coverUrl ? (
        <div className="absolute inset-0">
          <Image src={currentSong.coverUrl} alt="" fill className="object-cover opacity-15 blur-3xl scale-110" unoptimized />
          <div className="absolute inset-0 bg-[#07070f]/80" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-[#07070f]" />
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute top-6 left-6 z-10 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
      <button
        onClick={() => setShowQueue(!showQueue)}
        className="absolute top-6 right-6 z-10 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
      >
        <ListMusic className="w-6 h-6" />
      </button>

      <div className={`flex-1 flex flex-col items-center justify-center relative z-10 px-8 transition-all duration-300 ${showQueue ? 'mr-72' : ''}`}>
        {/* Album art */}
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden flex-shrink-0"
          style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
        >
          {currentSong.coverUrl ? (
            <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-6xl font-bold text-white">
              {currentSong.title?.[0]}
            </div>
          )}
        </motion.div>

        <Visualizer isPlaying={isPlaying} />

        {/* Song info */}
        <div className="mt-3 text-center">
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            {currentSong.title}
          </h2>
          <p className="text-white/60 mt-1">{currentSong.artist}</p>
          {currentSong.album && <p className="text-white/40 text-sm mt-0.5">{currentSong.album}</p>}
          {/* YouTube status */}
          {ytVideoId && (
            <div className={`flex items-center justify-center gap-1.5 mt-2 text-xs ${ytReady ? 'text-green-400' : 'text-yellow-400'}`}>
              <Wifi className="w-3 h-3" />
              {ytReady ? '▶ Full song via YouTube' : 'Loading full song...'}
            </div>
          )}
        </div>

        <button
          onClick={handleLike}
          className={`mt-3 transition-transform hover:scale-110 ${isLiked ? 'text-pink-500' : 'text-white/40 hover:text-white'}`}
        >
          <Heart className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Progress */}
        <div className="w-full max-w-xs mt-5">
          <div
            className="relative h-1 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleSeek}
          >
            <div className="h-full bg-white rounded-full transition-none" style={{ width: `${pct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-white/40 text-xs mt-1.5">
            <span>{fmt(progress)}</span>
            <span>{fmt(dur)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-7 mt-5">
          <button onClick={toggleShuffle} className={isShuffle ? 'text-purple-400' : 'text-white/40 hover:text-white transition-colors'}>
            <Shuffle className="w-5 h-5" />
          </button>
          <button onClick={skipPrev} className="text-white/80 hover:text-white transition-colors hover:scale-110">
            <SkipBack className="w-7 h-7" fill="currentColor" />
          </button>
          <button
            onClick={pauseResume}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
          >
            {isPlaying
              ? <Pause className="w-7 h-7 text-black" fill="black" />
              : <Play className="w-7 h-7 text-black ml-1" fill="black" />
            }
          </button>
          <button onClick={skipNext} className="text-white/80 hover:text-white transition-colors hover:scale-110">
            <SkipForward className="w-7 h-7" fill="currentColor" />
          </button>
          <button onClick={toggleRepeat} className={isRepeat !== 'off' ? 'text-purple-400' : 'text-white/40 hover:text-white transition-colors'}>
            {isRepeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 mt-5">
          <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01}
            value={isMuted ? 0 : volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-28 accent-white cursor-pointer"
          />
        </div>
      </div>

      {/* Queue panel */}
      {showQueue && (
        <motion.div
          initial={{ x: 288 }}
          animate={{ x: 0 }}
          className="absolute right-0 top-0 bottom-0 w-72 glass border-l border-white/10 p-6 overflow-y-auto z-20"
        >
          <h3 className="text-white font-semibold mb-4">Queue</h3>
          {queue.length === 0 ? (
            <p className="text-white/30 text-sm">Queue is empty</p>
          ) : (
            queue.map((s, i) => (
              <div key={s.id + i} className={`flex items-center gap-3 py-2.5 border-b border-white/5 ${s.id === currentSong.id ? 'opacity-100' : 'opacity-40'}`}>
                <div className="w-9 h-9 rounded-lg bg-[#1c1c33] flex-shrink-0 overflow-hidden">
                  {s.coverUrl && <Image src={s.coverUrl} alt="" width={36} height={36} className="object-cover" unoptimized />}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{s.title}</p>
                  <p className="text-white/40 text-xs truncate">{s.artist}</p>
                </div>
                {s.id === currentSong.id && isPlaying && (
                  <div className="flex items-end gap-0.5 ml-auto">
                    {[1, 2, 3].map(j => <div key={j} className="waveform-bar" style={{ height: '8px' }} />)}
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
