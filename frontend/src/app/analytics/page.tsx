'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Music2, Flame, Star, Headphones, TrendingUp, Calendar } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import { usePlayerStore } from '@/store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { playSong } = usePlayerStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => analyticsAPI.stats(period).then(r => r.data),
  });

  const maxDay = stats?.byDayOfWeek ? Math.max(...stats.byDayOfWeek, 1) : 1;
  const maxHour = stats?.byHour ? Math.max(...stats.byHour, 1) : 1;

  return (
    <div className="min-h-full px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Your Wrapped</h1>
          <p className="text-[#8888a8] mt-1">Your listening story, visualized</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${period === p ? 'bg-white text-black' : 'bg-[#0d0d1a] border border-[#1c1c33] text-[#8888a8] hover:text-white'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: 'Minutes Listened', value: stats.totalMinutes.toLocaleString(), color: 'from-purple-600/20 to-purple-600/5', ic: 'text-purple-400' },
              { icon: Music2, label: 'Songs Played', value: stats.totalSongs.toLocaleString(), color: 'from-pink-600/20 to-pink-600/5', ic: 'text-pink-400' },
              { icon: Flame, label: 'Listening Streak', value: `${stats.streak} days`, color: 'from-orange-600/20 to-orange-600/5', ic: 'text-orange-400' },
              { icon: Star, label: 'Top Artist', value: stats.topArtists?.[0]?.artist?.name || '—', color: 'from-yellow-600/20 to-yellow-600/5', ic: 'text-yellow-400' },
            ].map(({ icon: Icon, label, value, color, ic }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${color}`}>
                <Icon className={`w-6 h-6 ${ic} mb-3`} />
                <p className="text-2xl font-bold text-white truncate">{value}</p>
                <p className="text-[#8888a8] text-sm mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Top songs */}
          {stats.topSongs?.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" /> Top Songs</h2>
              <div className="space-y-1">
                {stats.topSongs.slice(0, 10).map((song: any, i: number) => (
                  <div key={song.id} onClick={() => playSong({ id: song.id, title: song.title, artist: song.artist || 'Unknown', coverUrl: song.coverUrl })}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <span className="w-6 text-center text-[#8888a8] text-sm font-mono flex-shrink-0">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-[#1c1c33] flex-shrink-0 overflow-hidden">
                      {song.coverUrl ? <img src={song.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xs font-bold text-purple-300">{song.title?.[0]}</div>}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{song.title}</p><p className="text-[#8888a8] text-xs truncate">{song.artist}</p></div>
                    <div className="text-right flex-shrink-0"><p className="text-white text-sm font-medium">{song.playCount}x</p><p className="text-[#8888a8] text-xs">plays</p></div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Top artists */}
          {stats.topArtists?.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Headphones className="w-5 h-5 text-pink-400" /> Top Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {stats.topArtists.slice(0, 5).map((item: any, i: number) => (
                  <motion.div key={item.artist?.name || i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-2xl p-4 text-center">
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-300">{item.artist?.name?.[0] || '?'}</span>
                    </div>
                    <p className="text-white text-sm font-semibold truncate">{item.artist?.name || 'Unknown'}</p>
                    <p className="text-[#8888a8] text-xs mt-1">{item.minutes}m listened</p>
                    {i === 0 && <span className="text-xs text-yellow-400 block mt-1">⭐ #1 Artist</span>}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* By day chart */}
          {stats.byDayOfWeek && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-400" /> Listening by Day</h2>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-end justify-between gap-2 h-28">
                  {stats.byDayOfWeek.map((count: number, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full rounded-t-md bg-gradient-to-t from-purple-600 to-pink-500 min-h-0" style={{ height: `${Math.max((count / maxDay) * 100, count > 0 ? 4 : 0)}%` }} />
                      <span className="text-[#8888a8] text-xs">{DAYS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* By hour */}
          {stats.byHour && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-400" /> When You Listen</h2>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-end gap-px h-20">
                  {stats.byHour.map((count: number, i: number) => (
                    <div key={i} className="flex-1 group relative">
                      <div className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600 to-teal-400 min-h-0" style={{ height: `${Math.max((count / maxHour) * 100, count > 0 ? 3 : 0)}%` }} />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c1c33] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {i}:00 — {count}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[#3a3a58] text-xs mt-2"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div>
              </div>
            </motion.section>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 text-[#8888a8] mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">No data yet</p>
          <p className="text-[#8888a8] mt-2">Start listening to see your stats here</p>
        </div>
      )}
    </div>
  );
}
