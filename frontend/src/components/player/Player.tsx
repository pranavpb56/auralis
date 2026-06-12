'use client';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, ChevronUp, Heart, Gauge, Maximize2,
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
    setPlaybackSpeed,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);

  const handleLike = async () => {
    if (!currentSong) return;
    try {
      const { data } = await playlistsAPI.likeSong(currentSong);
      setIsLiked(data.liked);
      toast.success(data.liked ? '❤️ Added to Liked Songs' : 'Removed');
    } catch {}
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const val = ((e.clientX - rect.left) / rect.width) * (duration || 0);
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

      {/* ── DESKTOP PLAYER ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 hidden md:block" style={{ height: 'var(--player-h)' }}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] cursor-pointer group" onClick={handleProgressClick}>
          <div className="w-full h-full bg-[#1e1e35] relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500"
              style={{ width: `${pct}%`, transition: 'width 0.3s linear' }}
            />
          </div>
          <div
            className="absolute -top-1 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>

        <div className="absolute inset-0 bg-[#0a0a16]/90 backdrop-blur-2xl border-t border-white/[0.06]">
          <div className="flex items-center h-full px-6 gap-6">

            {/* Song info */}
            <div className="flex items-center gap-3 w-[260px] min-w-0 flex-shrink-0">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#161628]">
                {currentSong.coverUrl
                  ? <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
                  : <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-pink-600/30 flex items-center justify-center text-violet-300 text-sm font-bold font-display">{currentSong.title?.[0]}</div>
                }
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                    {[1,2,3].map(i => <div key={i} className="waveform-bar" style={{ height: '7px', animationDelay: `${i*.12}s` }} />)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate leading-tight">{currentSong.title}</p>
                <p className="text-[#7070a0] text-xs truncate mt-0.5">{currentSong.artist}</p>
              </div>
              <button onClick={handleLike} className={`flex-shrink-0 transition-all hover:scale-110 ${isLiked ? 'text-pink-500' : 'text-[#7070a0] hover:text-white'}`}>
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Center controls */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="flex items-center gap-6">
                <button onClick={toggleShuffle} className={`transition-all hover:scale-110 ${isShuffle ? 'text-violet-400' : 'text-[#7070a0] hover:text-white'}`}>
                  <Shuffle className="w-4 h-4" />
                </button>
                <button onClick={skipPrev} className="text-[#7070a0] hover:text-white transition-all hover:scale-110">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={pauseResume}
                  className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
                >
                  {isPlaying
                    ? <Pause className="w-5 h-5 text-black" fill="black" />
                    : <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                  }
                </button>
                <button onClick={skipNext} className="text-[#7070a0] hover:text-white transition-all hover:scale-110">
                  <SkipForward className="w-5 h-5" />
                </button>
                <button onClick={toggleRepeat} className={`transition-all hover:scale-110 ${isRepeat !== 'off' ? 'text-violet-400' : 'text-[#7070a0] hover:text-white'}`}>
                  {isRepeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#7070a0]">
                <span className="w-8 text-right tabular-nums">{fmt(progress)}</span>
                <span className="opacity-40">/</span>
                <span className="w-8 tabular-nums">{fmt(dur)}</span>
                {ytVideoId && (
                  <span className={`flex items-center gap-1 text-[10px] font-medium ${ytReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                    {ytReady ? 'Live' : 'Loading'}
                  </span>
                )}
              </div>
            </div>

            {/* Right controls */}
            <div className="w-[220px] flex items-center justify-end gap-4 flex-shrink-0">
              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeed(s => !s)}
                  className="flex items-center gap-1 text-[#7070a0] hover:text-white transition-colors text-xs font-mono font-medium"
                >
                  <Gauge className="w-3.5 h-3.5" />{playbackSpeed}x
                </button>
                {showSpeed && (
                  <div className="absolute bottom-9 right-0 bg-[#0f0f1c] border border-white/10 rounded-2xl p-1.5 space-y-0.5 min-w-[4.5rem] z-50 shadow-2xl">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                      <button key={s} onClick={() => { setPlaybackSpeed(s); setShowSpeed(false); }}
                        className={`block w-full text-right px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${playbackSpeed === s ? 'text-violet-400 bg-violet-500/10' : 'text-[#7070a0] hover:text-white hover:bg-white/5'}`}>
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-[#7070a0] hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input type="range" min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="vol w-20"
                  style={{ background: `linear-gradient(to right, #7c3aed ${(isMuted ? 0 : volume)*100}%, #1e1e35 ${(isMuted ? 0 : volume)*100}%)` }}
                />
              </div>

              <button onClick={toggleFullscreen} className="text-[#7070a0] hover:text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE MINI-PLAYER ── */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="fixed z-50 md:hidden"
        style={{ bottom: 'calc(var(--mobile-nav-h) + 10px)', left: 10, right: 10 }}
      >
        <div className="mobile-player-card rounded-2xl overflow-hidden">
          {/* Progress strip */}
          <div className="h-[2px] bg-white/[0.06] relative">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
              style={{ width: `${pct}%`, transition: 'width 0.5s linear' }}
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Cover art — tap to open fullscreen */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer active:scale-95 transition-transform" onClick={toggleFullscreen}>
              {currentSong.coverUrl
                ? <Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" unoptimized />
                : <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-base font-bold font-display">{currentSong.title?.[0]}</div>
              }
              {isPlaying && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center gap-0.5">
                  {[1,2,3].map(i => <div key={i} className="waveform-bar" style={{ height: '6px', animationDelay:`${i*.12}s` }} />)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={toggleFullscreen}>
              <p className="text-white text-sm font-semibold truncate leading-tight">{currentSong.title}</p>
              <p className="text-[#7070a0] text-xs truncate mt-0.5">{currentSong.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={handleLike} className={`touch-target rounded-full transition-colors ${isLiked ? 'text-pink-500' : 'text-[#7070a0]'}`}>
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={skipPrev} className="touch-target text-[#7070a0] active:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={pauseResume}
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-xl mx-1"
              >
                {isPlaying
                  ? <Pause className="w-5 h-5 text-black" fill="black" />
                  : <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                }
              </button>
              <button onClick={skipNext} className="touch-target text-[#7070a0] active:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
