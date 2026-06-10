'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music2, Sparkles, Zap, Headphones, Play, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07070f] overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/6 rounded-full blur-3xl pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Auralis</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-[#8888a8] hover:text-white transition-colors text-sm font-medium">Log in</Link>
          <Link href="/auth/signup" className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity">Get started free</Link>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-16 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" /> AI-Powered Music Discovery
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-6xl md:text-8xl font-bold text-white leading-tight max-w-5xl" style={{ fontFamily: 'Georgia, serif' }}>
          Music that <span className="gradient-text">feels</span> like you
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-6 text-xl text-[#8888a8] max-w-2xl leading-relaxed">
          Auralis uses AI to generate playlists from a sentence, discover music that matches your every mood, and give you a real listening experience.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center gap-4 mt-10">
          <Link href="/auth/signup" className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg hover:opacity-90 transition-all hover:scale-105 neon">
            <Play className="w-5 h-5" /> Start listening free
          </Link>
          <Link href="/auth/login" className="flex items-center gap-2 px-8 py-4 glass rounded-full text-white font-semibold text-lg hover:bg-white/10 transition-all">
            Sign in <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Mock player */}
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.6 }}
          className="mt-20 w-full max-w-3xl glass-card rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5" />
          <div className="relative flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-spin-slow flex-shrink-0">
              <Music2 className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-xl">Kesariya</p>
              <p className="text-[#8888a8] text-sm mt-1">Arijit Singh · Brahmastra</p>
              <div className="mt-3 h-1.5 bg-[#1c1c33] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-2/5 transition-all" />
              </div>
            </div>
            <div className="flex items-end gap-1">
              {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" style={{ height: `${12 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />)}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[['Bollywood','from-purple-600','to-fuchsia-700'],['Lo-fi','from-blue-600','to-cyan-700'],['Telugu','from-green-600','to-teal-700'],['Party','from-pink-600','to-rose-700']].map(([n,f,t]) => (
              <div key={n} className={`h-16 rounded-xl flex items-end p-3 bg-gradient-to-br ${f} ${t} opacity-80`}>
                <span className="text-white text-xs font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 px-8 py-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Sparkles, title: 'AI Playlist Generator', desc: 'Type any vibe — "Telugu night drive" or "gym pump" — and get a perfect playlist in seconds.', color: 'from-purple-500/20 to-purple-500/5', ic: 'text-purple-400' },
          { icon: Zap, title: 'Smart Recommendations', desc: 'Personalized music discovery powered by your listening habits and preferences.', color: 'from-pink-500/20 to-pink-500/5', ic: 'text-pink-400' },
          { icon: Headphones, title: 'Real Audio Playback', desc: '30-second previews via iTunes for millions of songs. Full player controls with visualizer.', color: 'from-cyan-500/20 to-cyan-500/5', ic: 'text-cyan-400' },
        ].map(({ icon: Icon, title, desc, color, ic }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
            className={`glass-card rounded-2xl p-8 bg-gradient-to-br ${color}`}>
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 ${ic}`}><Icon className="w-6 h-6" /></div>
            <h3 className="text-white font-semibold text-xl mb-3">{title}</h3>
            <p className="text-[#8888a8] leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-[#1c1c33] px-8 py-8 text-center text-[#8888a8] text-sm">
        © {new Date().getFullYear()} Auralis · Built with Next.js, Express & Groq AI · Music via iTunes API (free)
      </footer>
    </div>
  );
}
