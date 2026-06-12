'use client';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ChevronDown, ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '@/store';
import { useState } from 'react';
import { playlistsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function Visualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-10">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: `${12 + Math.sin(i * 0.7) * 8}px`,
            background: `hsl(${260 + i * 4}, 80%, 65%)`,
            transformOrigin: 'bottom',
          }}
          animate={isPlaying
            ? { scaleY: [0.25, 1, 0.4, 0.85, 0.25], opacity: [0.5, 1, 0.65, 1, 0.5] }
            : { scaleY: 0.12, opacity: 0.25 }
          }
          transition={{ duration: 1.0 + (i % 3) * 0.15, repeat: Infinity, delay: (i * 0.045) % 1.0, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function FullscreenPlayer() {
  const {
    currentSong, isPlaying, volume, isMuted, progress, duration,
    isRepeat, isShuffle, queue,
    pauseResume, skipNext, skipPrev, setVolume, toggleMute,
    setProgress, toggleRepeat, toggleShuffle, toggleFullscreen,
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const val = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * (duration || 0);
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

  // Swipe-down to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 220], [1, 0]);
  const scale = useTransform(y, [0, 220], [1, 0.94]);

  if (!currentSong) return null;

  return (
    <motion.div
      style={{ y, opacity }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 320 }}
      dragElastic={{ top: 0, bottom: 0.35 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 130 || info.velocity.y > 500) toggleFullscreen();
        else animate(y, 0, { type: 'spring', damping: 22 });
      }}
      className="fixed inset-0 z-[100] overflow-hidden"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      {/* Blurred album art background */}
      <div className="absolute inset-0">
        {currentSong.coverUrl ? (
          <>
            <Image src={currentSong.coverUrl} alt="" fill className="object-cover scale-110 blur-3xl opacity-25" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080810]/60 via-[#080810]/75 to-[#080810]/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/70 via-[#080810] to-[#080810]" />
        )}
      </div>

      {/* Drag handle */}
      <div className="absolute top-3 inset-x-0 flex justify-center z-20">
        <div className="w-10 h-1 rounded-full bg-white/25" />
      </div>

      {/* Header buttons */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-8 left-5 z-20 p-2.5 rounded-full bg-white/8 active:bg-white/15 transition-colors"
      >
        <ChevronDown className="w-5 h-5 text-white/70" />
      </button>
      <button
        onClick={() => setShowQueue(q => !q)}
        className={`absolute top-8 right-5 z-20 p-2.5 rounded-full transition-colors ${showQueue ? 'bg-violet-500/20 text-violet-400' : 'bg-white/8 active:bg-white/15 text-white/70'}`}
      >
        <ListMusic className="w-5 h-5" />
      </button>

      {/* Main content */}
      <motion.div
        style={{ scale }}
        className={`absolute inset-0 flex flex-col items-center justify-between pt-20 pb-10 px-7 transition-all duration-300 ${showQueue ? 'md:mr-72' : ''}`}
      >
        {/* Album art */}
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="relative w-full max-w-[300px] aspect-square rounded-[28px] overflow-hidden flex-shrink-0 self-center"
          style={{ boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          {currentSong.coverUrl
            ? <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
            : <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-6xl font-bold font-display">{currentSong.title?.[0]}</div>
          }
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        </motion.div>

        {/* Visualizer */}
        <Visualizer isPlaying={isPlaying} />

        {/* Song info */}
        <div className="w-full max-w-[320px] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-white text-2xl font-bold leading-tight truncate font-display">
              {currentSong.title}
            </h2>
            <p className="text-white/55 mt-1 truncate text-[15px]">{currentSong.artist}</p>
            {currentSong.album && <p className="text-white/30 text-xs mt-0.5 truncate">{currentSong.album}</p>}
          </div>
          <button
            onClick={handleLike}
            className={`flex-shrink-0 p-2.5 rounded-full transition-all active:scale-90 ${isLiked ? 'text-pink-500 bg-pink-500/15' : 'text-white/35 hover:text-white bg-white/5'}`}
          >
            <Heart className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="w-full max-w-[320px] space-y-2">
          <div
            className="relative h-1.5 rounded-full cursor-pointer touch-none group"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            onClick={handleSeek}
            onTouchMove={handleSeek}
          >
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${pct}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-white/35 text-xs tabular-nums">
            <span>{fmt(progress)}</span>
            <span>{fmt(dur)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="w-full max-w-[320px]">
          <div className="flex items-center justify-between">
            <button onClick={toggleShuffle} className={`p-3 rounded-full transition-all active:scale-90 ${isShuffle ? 'text-violet-400 bg-violet-500/15' : 'text-white/35 hover:text-white'}`}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={skipPrev} className="p-2 text-white/80 active:scale-90 transition-all">
              <SkipBack className="w-9 h-9" fill="currentColor" />
            </button>
            <button
              onClick={pauseResume}
              className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shadow-2xl"
            >
              {isPlaying
                ? <Pause className="w-8 h-8 text-black" fill="black" />
                : <Play className="w-8 h-8 text-black ml-1" fill="black" />
              }
            </button>
            <button onClick={skipNext} className="p-2 text-white/80 active:scale-90 transition-all">
              <SkipForward className="w-9 h-9" fill="currentColor" />
            </button>
            <button onClick={toggleRepeat} className={`p-3 rounded-full transition-all active:scale-90 ${isRepeat !== 'off' ? 'text-violet-400 bg-violet-500/15' : 'text-white/35 hover:text-white'}`}>
              {isRepeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 mt-6">
            <button onClick={toggleMute} className="text-white/35 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="flex-1"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.85) ${(isMuted ? 0 : volume)*100}%, rgba(255,255,255,0.12) ${(isMuted ? 0 : volume)*100}%)`
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Queue panel */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-[#0a0a18]/95 backdrop-blur-2xl border-l border-white/8 p-6 overflow-y-auto z-20"
          >
            <h3 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest text-white/50">Up Next</h3>
            {queue.length === 0
              ? <p className="text-white/25 text-sm">Queue is empty</p>
              : queue.map((s, i) => (
                <div key={s.id + i} className={`flex items-center gap-3 py-3 border-b border-white/[0.05] ${s.id === currentSong.id ? 'opacity-100' : 'opacity-35'}`}>
                  <div className="w-10 h-10 rounded-xl bg-[#161628] flex-shrink-0 overflow-hidden">
                    {s.coverUrl && <Image src={s.coverUrl} alt="" width={40} height={40} className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${s.id === currentSong.id ? 'text-white' : 'text-white/70'}`}>{s.title}</p>
                    <p className="text-white/35 text-xs truncate mt-0.5">{s.artist}</p>
                  </div>
                  {s.id === currentSong.id && isPlaying && (
                    <div className="flex items-end gap-0.5 ml-auto flex-shrink-0">
                      {[1,2,3].map(j => <div key={j} className="waveform-bar" style={{ height: '8px' }} />)}
                    </div>
                  )}
                </div>
              ))
            }
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
