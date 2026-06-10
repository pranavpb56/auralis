import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  duration?: number;
  previewUrl?: string;
  externalUrl?: string;
  youtubeId?: string; // injected when found
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface PlayerStore {
  currentSong: Song | null;
  queue: Song[];
  history: Song[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  isRepeat: 'off' | 'one' | 'all';
  isShuffle: boolean;
  isFullscreen: boolean;
  playbackSpeed: number;
  // YouTube player state
  ytReady: boolean;
  ytVideoId: string | null;

  playSong: (song: Song, queue?: Song[]) => void;
  pauseResume: () => void;
  setIsPlaying: (v: boolean) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setProgress: (v: number) => void;
  setDuration: (v: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleFullscreen: () => void;
  setPlaybackSpeed: (v: number) => void;
  addToQueue: (s: Song) => void;
  setYtReady: (v: boolean) => void;
  setYtVideoId: (id: string | null) => void;
  updateCurrentSongYtId: (id: string) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      history: [],
      isPlaying: false,
      volume: 0.8,
      isMuted: false,
      progress: 0,
      duration: 0,
      isRepeat: 'off',
      isShuffle: false,
      isFullscreen: false,
      playbackSpeed: 1,
      ytReady: false,
      ytVideoId: null,

      playSong: (song, queue) => {
        const { currentSong } = get();
        if (currentSong) set(s => ({ history: [currentSong, ...s.history].slice(0, 50) }));
        set({
          currentSong: song,
          isPlaying: true,
          progress: 0,
          duration: song.duration || 0,
          queue: queue || get().queue,
          ytVideoId: song.youtubeId || null,
          ytReady: false,
        });
      },

      pauseResume: () => set(s => ({ isPlaying: !s.isPlaying })),
      setIsPlaying: v => set({ isPlaying: v }),

      skipNext: () => {
        const { queue, currentSong, isShuffle, history } = get();
        if (!currentSong) return;
        const idx = queue.findIndex(s => s.id === currentSong.id);
        const next = isShuffle
          ? queue.filter(s => s.id !== currentSong.id)[Math.floor(Math.random() * (queue.length - 1))]
          : queue[idx + 1];
        if (next) {
          set(s => ({ history: [currentSong, ...s.history].slice(0, 50) }));
          set({ currentSong: next, isPlaying: true, progress: 0, ytVideoId: next.youtubeId || null, ytReady: false });
        }
      },

      skipPrev: () => {
        const { history, progress } = get();
        if (progress > 3) { set({ progress: 0 }); return; }
        const prev = history[0];
        if (prev) set({ currentSong: prev, isPlaying: true, progress: 0, history: history.slice(1), ytVideoId: prev.youtubeId || null, ytReady: false });
      },

      setVolume: v => set({ volume: v, isMuted: v === 0 }),
      toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
      setProgress: v => set({ progress: v }),
      setDuration: v => set({ duration: v }),
      toggleRepeat: () => set(s => ({
        isRepeat: s.isRepeat === 'off' ? 'all' : s.isRepeat === 'all' ? 'one' : 'off'
      })),
      toggleShuffle: () => set(s => ({ isShuffle: !s.isShuffle })),
      toggleFullscreen: () => set(s => ({ isFullscreen: !s.isFullscreen })),
      setPlaybackSpeed: v => set({ playbackSpeed: v }),
      addToQueue: s => set(st => ({ queue: [...st.queue, s] })),
      setYtReady: v => set({ ytReady: v }),
      setYtVideoId: id => set({ ytVideoId: id }),
      updateCurrentSongYtId: id => set(s => ({
        currentSong: s.currentSong ? { ...s.currentSong, youtubeId: id } : s.currentSong,
        ytVideoId: id,
      })),
    }),
    {
      name: 'auralis-player',
      partialize: s => ({
        volume: s.volume,
        isMuted: s.isMuted,
        isRepeat: s.isRepeat,
        isShuffle: s.isShuffle,
        playbackSpeed: s.playbackSpeed,
      }),
    }
  )
);

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      user: null,
      token: null,
      setUser: user => set({ user }),
      setToken: token => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auralis-auth' }
  )
);

interface UIStore {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useUIStore = create<UIStore>(set => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: v => set({ sidebarCollapsed: v }),
}));
