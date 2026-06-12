'use client';
/**
 * YoutubeEngine — hidden iframe that drives full song playback.
 * Uses YouTube IFrame Player API (loaded once globally).
 * Communicates state up via Zustand store.
 * Also manages Media Session API for background / lock-screen playback.
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store';
import { youtubeAPI, playlistsAPI } from '@/lib/api';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoaded: boolean;
  }
}

export default function YoutubeEngine() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<any>(null);
  const lastSongIdRef = useRef<string | null>(null);

  const {
    currentSong, isPlaying, volume, isMuted, playbackSpeed,
    isRepeat, ytVideoId,
    setIsPlaying, setProgress, setDuration, skipNext,
    setYtReady, setYtVideoId, updateCurrentSongYtId,
    pauseResume, skipPrev,
  } = usePlayerStore();

  // ── Media Session API ──────────────────────────────────────────────────────
  const updateMediaSession = useCallback(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const song = usePlayerStore.getState().currentSong;
    if (!song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title || 'Unknown',
      artist: song.artist || 'Unknown',
      album: song.album || 'Auralis',
      artwork: song.coverUrl
        ? [{ src: song.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
  }, []);

  const setMediaSessionHandlers = useCallback(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => {
      const p = playerRef.current;
      if (p?.playVideo) p.playVideo();
      usePlayerStore.getState().setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      const p = playerRef.current;
      if (p?.pauseVideo) p.pauseVideo();
      usePlayerStore.getState().setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      usePlayerStore.getState().skipNext();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      usePlayerStore.getState().skipPrev();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        const p = playerRef.current;
        if (p?.seekTo) p.seekTo(details.seekTime, true);
        usePlayerStore.getState().setProgress(details.seekTime);
      }
    });
  }, []);

  const updatePositionState = useCallback(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      const { progress, duration } = usePlayerStore.getState();
      const p = playerRef.current;
      const rate = p?.getPlaybackRate?.() || 1;
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: rate,
          position: Math.min(progress, duration),
        });
      }
    } catch {}
  }, []);

  // ── YouTube IFrame API ─────────────────────────────────────────────────────
  useEffect(() => {
    if (window._ytApiLoaded) return;
    window._ytApiLoaded = true;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      createPlayer('__yt_placeholder__');
    };
  }, []);

  const createPlayer = useCallback((videoId: string) => {
    if (!containerRef.current) return;

    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '1',
      width: '1',
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  }, []);

  const onPlayerReady = useCallback((e: any) => {
    setYtReady(true);
    const p = e.target;
    p.setVolume(Math.round(volume * 100));
    p.setPlaybackRate(playbackSpeed);

    const dur = p.getDuration?.() || 0;
    if (dur > 0) setDuration(dur);

    updateMediaSession();
    setMediaSessionHandlers();
    startProgressInterval();
  }, [volume, playbackSpeed, updateMediaSession, setMediaSessionHandlers]);

  const onPlayerStateChange = useCallback((e: any) => {
    const YT = window.YT;
    if (!YT) return;

    if (e.data === YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      const dur = e.target.getDuration?.() || 0;
      if (dur > 0) setDuration(dur);
      startProgressInterval();
    } else if (e.data === YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      clearProgressInterval();
    } else if (e.data === YT.PlayerState.ENDED) {
      clearProgressInterval();
      setProgress(0);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      const { isRepeat: rep } = usePlayerStore.getState();
      if (rep === 'one') {
        e.target.seekTo(0);
        e.target.playVideo();
      } else {
        skipNext();
      }
    }
  }, [skipNext]);

  const onPlayerError = useCallback((e: any) => {
    console.warn('YT player error:', e.data);
    skipNext();
  }, [skipNext]);

  const startProgressInterval = useCallback(() => {
    clearProgressInterval();
    progressIntervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      try {
        const t = p.getCurrentTime() || 0;
        setProgress(t);
        updatePositionState();
      } catch {}
    }, 500);
  }, [setProgress, updatePositionState]);

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // When song changes → find YouTube ID then create/load player
  useEffect(() => {
    if (!currentSong) return;
    if (currentSong.id === lastSongIdRef.current) return;
    lastSongIdRef.current = currentSong.id;

    const loadSong = async () => {
      let videoId = currentSong.youtubeId || ytVideoId;

      if (!videoId) {
        try {
          const { data } = await youtubeAPI.find(currentSong.title, currentSong.artist);
          videoId = data.videoId;
          if (videoId) updateCurrentSongYtId(videoId);
        } catch (e) {
          console.error('YouTube find error:', e);
        }
      }

      if (!videoId) {
        console.warn('No YouTube video found for:', currentSong.title);
        return;
      }

      // Update media session metadata immediately when song loads
      updateMediaSession();
      setMediaSessionHandlers();

      playlistsAPI.recordPlay(currentSong).catch(() => {});

      const YT = window.YT;

      if (!YT || !YT.Player) {
        window.onYouTubeIframeAPIReady = () => createPlayer(videoId!);
        return;
      }

      if (!playerRef.current) {
        createPlayer(videoId);
      } else {
        try {
          playerRef.current.loadVideoById(videoId);
        } catch {
          createPlayer(videoId);
        }
      }
    };

    loadSong();
  }, [currentSong?.id]);

  // Sync play/pause
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.getPlayerState) return;
    try {
      const state = p.getPlayerState();
      const YT = window.YT;
      if (!YT) return;
      if (isPlaying && state !== YT.PlayerState.PLAYING) p.playVideo();
      if (!isPlaying && state === YT.PlayerState.PLAYING) p.pauseVideo();
    } catch {}
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.setVolume) return;
    try { p.setVolume(isMuted ? 0 : Math.round(volume * 100)); } catch {}
  }, [volume, isMuted]);

  // Sync playback speed
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.setPlaybackRate) return;
    try { p.setPlaybackRate(playbackSpeed); } catch {}
  }, [playbackSpeed]);

  // Update media session when song metadata changes
  useEffect(() => {
    updateMediaSession();
  }, [currentSong?.title, currentSong?.coverUrl]);

  // Expose seek function globally for progress bar
  useEffect(() => {
    (window as any)._auralisSeek = (seconds: number) => {
      const p = playerRef.current;
      if (p?.seekTo) { p.seekTo(seconds, true); setProgress(seconds); }
    };
    return () => { delete (window as any)._auralisSeek; };
  }, [setProgress]);

  return (
    <div
      style={{ position: 'fixed', bottom: -10, left: -10, width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      aria-hidden="true"
    >
      <div ref={containerRef} id="yt-player-container" />
    </div>
  );
}
