'use client';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, ChevronDown, ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '@/store';
import { useState, useRef } from 'react';
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = (clientX - rect.left) / rect.width;
    const val = Math.max(0, Math.min(1, pct)) * (duration || 0);
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

  // Swipe-down to close on mobile
  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [0, 200], [1, 0]);

  if (!currentSong) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[100] flex overflow-hidden"
      style={{ y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={{ top: 0, bottom: 0.4 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120 || info.velocity.y > 400) toggleFullscreen();
        else animate(y, 0, { type: 'spring', damping: 20 });
      }}
    >
      {/* Blurred background */}
      <motion.div className="absolute inset-0" style={{ opacity: bgOpacity }}>
        {currentSong.coverUrl ? (
          <div className="absolute inset-0">
            <Image src={currentSong.coverUrl} alt="" fill className="object-cover opacity-20 blur-3xl scale-110" unoptimized />
            <div className="absolute inset-0 bg-[#07070f]/75" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-[#07070f] to-[#07070f]" />
        )}
      </motion.div>

      {/* Drag handle pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-white/20 z-20" />

      {/* Top controls */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 left-5 z-10 text-white/60 hover:text-white transition-colors p-2.5 rounded-full hover:bg-white/10 active:bg-white/20"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
      <button
        onClick={() => setShowQueue(!showQueue)}
        className={`absolute top-6 right-5 z-10 transition-colors p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 ${showQueue ? 'text-purple-400' : 'text-white/60 hover:text-white'}`}
      >
        <ListMusic className="w-6 h-6" />
      </button>

      {/* Main content */}
      <div className={`flex-1 flex flex-col items-center justify-between relative z-10 px-6 pt-16 pb-10 transition-all duration-300 ${showQueue ? 'md:mr-72' : ''}`}>

        {/* Album art */}
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative rounded-3xl overflow-hidden flex-shrink-0 w-full max-w-xs aspect-square"
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
        >
          {currentSong.coverUrl ? (
            <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-6xl font-bold text-white">
              {currentSong.title?.[0]}
            </div>
          )}
          {/* Subtle shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </motion.div>

        <Visualizer isPlaying={isPlaying} />

        {/* Song info + like */}
        <div className="w-full max-w-xs flex items-start justify-between mt-1">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-white text-2xl font-bold leading-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
              {currentSong.title}
            </h2>
            <p className="text-white/60 mt-1 truncate">{currentSong.artist}</p>
            {currentSong.album && <p className="text-white/35 text-sm mt-0.5 truncate">{currentSong.album}</p>}
            {ytVideoId && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs ${ytReady ? 'text-green-400' : 'text-yellow-400'}`}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {ytReady ? 'Full song' : 'Loading...'}
              </div>
            )}
          </div>
          <button
            onClick={handleLike}
            className={`flex-shrink-0 p-2 rounded-full transition-all active:scale-90 ${isLiked ? 'text-pink-500' : 'text-white/40 hover:text-white'}`}
          >
            <Heart className="w-6 h-6" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mt-4">
          <div
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group touch-none"
            onClick={handleSeek}
            onTouchMove={handleSeek}
          >
            <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${pct}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-white/40 text-xs mt-2">
            <span>{fmt(progress)}</span>
            <span>{fmt(dur)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={toggleShuffle}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${isShuffle ? 'text-purple-400' : 'text-white/40 hover:text-white'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={skipPrev}
              className="p-2.5 text-white/90 hover:text-white active:scale-90 transition-all"
            >
              <SkipBack className="w-8 h-8" fill="currentColor" />
            </button>

            <button
              onClick={pauseResume}
              className="w-18 h-18 w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shadow-2xl"
            >
              {isPlaying
                ? <Pause className="w-8 h-8 text-black" fill="black" />
                : <Play className="w-8 h-8 text-black ml-1" fill="black" />
              }
            </button>

            <button
              onClick={skipNext}
              className="p-2.5 text-white/90 hover:text-white active:scale-90 transition-all"
            >
              <SkipForward className="w-8 h-8" fill="currentColor" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${isRepeat !== 'off' ? 'text-purple-400' : 'text-white/40 hover:text-white'}`}
            >
              {isRepeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 mt-5">
            <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors p-1">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="flex-1"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.9) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Queue panel */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ x: 288 }}
            animate={{ x: 0 }}
            exit={{ x: 288 }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute right-0 top-0 bottom-0 w-72 glass border-l border-white/10 p-6 overflow-y-auto z-20"
          >
            <h3 className="text-white font-semibold mb-4">Up Next</h3>
            {queue.length === 0 ? (
              <p className="text-white/30 text-sm">Queue is empty</p>
            ) : (
              queue.map((s, i) => (
                <div key={s.id + i} className={`flex items-center gap-3 py-2.5 border-b border-white/5 ${s.id === currentSong.id ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="w-9 h-9 rounded-lg bg-[#1c1c33] flex-shrink-0 overflow-hidden">
                    {s.coverUrl && <Image src={s.coverUrl} alt="" width={36} height={36} className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${s.id === currentSong.id ? 'text-white' : 'text-white/60'}`}>{s.title}</p>
                    <p className="text-white/40 text-xs truncate">{s.artist}</p>
                  </div>
                  {s.id === currentSong.id && isPlaying && (
                    <div className="flex items-end gap-0.5 ml-auto flex-shrink-0">
                      {[1, 2, 3].map(j => <div key={j} className="waveform-bar" style={{ height: '8px' }} />)}
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
