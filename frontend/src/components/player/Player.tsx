'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Maximize2, Heart, Gauge, ChevronUp,
} from 'lucide-react';
import { usePlayerStore } from '@/store';
import { playlistsAPI } from '@/lib/api';
import YoutubeEngine from './YoutubeEngine';
import toast from 'react-hot-toast';

export default function Player() {
  const {
    currentSong, isPlaying, volume, isMuted, progress, duration,
    isRepeat, isShuffle, playbackSpeed, ytVideoId, ytReady,
    pauseResume, skipNext, skipPrev, setVolume, toggleMute,
    setProgress, toggleRepeat, toggleShuffle, toggleFullscreen,
    setPlaybackSpeed, setIsPlaying,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);

  const handleLike = async () => {
    if (!currentSong) return;
    try {
      const { data } = await playlistsAPI.likeSong(currentSong);
      setIsLiked(data.liked);
      toast.success(data.liked ? '❤️ Added to Liked Songs' : 'Removed from Liked Songs');
    } catch {}
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if ((window as any)._auralisSeek) (window as any)._auralisSeek(val);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const val = pct * (duration || 0);
    setProgress(val);
    if ((window as any)._auralisSeek) (window as any)._auralisSeek(val);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const dur = duration || currentSong?.duration || 0;
  const pct = dur > 0 ? Math.min((progress / dur) * 100, 100) : 0;

  if (!currentSong) return <YoutubeEngine />;

  return (
    <>
      <YoutubeEngine />

      {/* ─── DESKTOP PLAYER ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[#1c1c33] hidden md:flex flex-col"
        style={{ height: 'var(--player-h)' }}
      >
        {/* Progress strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div className="w-full h-full bg-[#1c1c33] relative">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full -mt-px opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>
        </div>

        <div className="flex items-center h-full px-4 gap-4">
          {/* Song info */}
          <div className="flex items-center gap-3 w-64 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#1c1c33]">
              {currentSong.coverUrl ? (
                <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">
                  {currentSong.title?.[0]}
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="waveform-bar" style={{ height: '8px', animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{currentSong.title}</p>
              <p className="text-[#8888a8] text-xs truncate">{currentSong.artist}</p>
            </div>

            <button
              onClick={handleLike}
              className={`flex-shrink-0 transition-colors ${isLiked ? 'text-pink-500' : 'text-[#8888a8] hover:text-white'}`}
            >
              <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-5">
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${isShuffle ? 'text-purple-400' : 'text-[#8888a8] hover:text-white'}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button onClick={skipPrev} className="text-[#8888a8] hover:text-white transition-colors hover:scale-110">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={pauseResume}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              >
                {isPlaying
                  ? <Pause className="w-5 h-5 text-black" fill="black" />
                  : <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                }
              </button>

              <button onClick={skipNext} className="text-[#8888a8] hover:text-white transition-colors hover:scale-110">
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`transition-colors ${isRepeat !== 'off' ? 'text-purple-400' : 'text-[#8888a8] hover:text-white'}`}
              >
                {isRepeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-[#8888a8]">
              <span className="w-8 text-right">{fmt(progress)}</span>
              <span>/</span>
              <span className="w-8">{fmt(dur)}</span>
              {ytVideoId && (
                <span className={`text-xs flex items-center gap-1 ${ytReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {ytReady ? '● Full song' : '● Loading...'}
                </span>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="w-56 flex items-center justify-end gap-3">
            {/* Playback speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeed(s => !s)}
                className="flex items-center gap-1 text-[#8888a8] hover:text-white transition-colors text-xs font-mono"
              >
                <Gauge className="w-3.5 h-3.5" />{playbackSpeed}x
              </button>
              {showSpeed && (
                <div className="absolute bottom-8 right-0 glass-card rounded-xl p-2 space-y-0.5 min-w-16 z-50">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                    <button
                      key={s}
                      onClick={() => { setPlaybackSpeed(s); setShowSpeed(false); }}
                      className={`block w-full text-right px-3 py-1.5 rounded-lg text-sm transition-colors ${playbackSpeed === s ? 'text-purple-400' : 'text-[#8888a8] hover:text-white'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-[#8888a8] hover:text-white transition-colors">
                {isMuted || volume === 0
                  ? <VolumeX className="w-4 h-4" />
                  : volume < 0.5
                    ? <Volume1 className="w-4 h-4" />
                    : <Volume2 className="w-4 h-4" />
                }
              </button>
              <input
                type="range" min={0} max={1} step={0.01}
                value={isMuted ? 0 : volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="vol w-20"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 ${(isMuted ? 0 : volume) * 100}%, #3a3a58 ${(isMuted ? 0 : volume) * 100}%)`
                }}
              />
            </div>

            <button onClick={toggleFullscreen} className="text-[#8888a8] hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── MOBILE MINI-PLAYER ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed z-50 md:hidden"
        style={{ bottom: 'var(--mobile-nav-h)', left: 8, right: 8 }}
      >
        <div className="mobile-player-card rounded-2xl overflow-hidden">
          {/* Thin progress bar on top */}
          <div className="h-0.5 bg-white/10 relative">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Cover */}
            <div
              className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
              onClick={toggleFullscreen}
            >
              {currentSong.coverUrl ? (
                <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  {currentSong.title?.[0]}
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="waveform-bar" style={{ height: '6px', animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={toggleFullscreen}>
              <p className="text-white text-sm font-semibold truncate leading-tight">{currentSong.title}</p>
              <p className="text-[#8888a8] text-xs truncate mt-0.5">{currentSong.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${isLiked ? 'text-pink-500' : 'text-[#8888a8]'}`}
              >
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              <button onClick={skipPrev} className="p-2 text-[#8888a8] active:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={pauseResume}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shadow-lg ml-1"
              >
                {isPlaying
                  ? <Pause className="w-5 h-5 text-black" fill="black" />
                  : <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                }
              </button>

              <button onClick={skipNext} className="p-2 text-[#8888a8] active:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>

              <button onClick={toggleFullscreen} className="p-2 text-[#8888a8] active:text-white transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
