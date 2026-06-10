'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Wand2, Loader2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import SongCard from '@/components/music/SongCard';
import toast from 'react-hot-toast';
import type { Song } from '@/store';

const QUICK = ['Create a gym playlist 💪', 'Telugu night drive songs 🌙', 'Relaxing study music 📚', 'Best Bollywood party tracks 🎉', 'Lo-fi beats for focus 🎧', 'Songs like Arijit Singh 🎤'];
const CHAT_Q = ['Recommend songs for a road trip', 'What are trending Indian pop songs?', 'Find songs similar to The Weeknd', 'Best songs to work out to'];

type Mode = 'chat' | 'generate';

export default function AIPage() {
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<any[]>([{
    role: 'assistant', content: "Hey! I'm Auralis AI 🎵 Your personal music companion. Ask me for recommendations, similar artists, mood playlists — or switch to Generate mode to create a full playlist from a single sentence!",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [plName, setPlName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMessages(m => [...m, { role: 'user', content: msg, timestamp: new Date() }]);
    setInput(''); setLoading(true);
    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const { data } = await aiAPI.chat({ message: msg, conversationHistory: history });
      setMessages(m => [...m, { role: 'assistant', content: data.message, songs: data.songs?.slice(0, 4), timestamp: new Date() }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, something went wrong. Make sure your GROQ_API_KEY is set in .env!", timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const genPlaylist = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setGenerated(null);
    try {
      const { data } = await aiAPI.generatePlaylist({ prompt, name: plName || undefined });
      setGenerated(data);
      toast.success(`Playlist "${data.playlist.name}" created!`);
    } catch { toast.error('Generation failed — check your GROQ_API_KEY'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-full flex flex-col px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>AI Music Assistant</h1>
        </div>
        <p className="text-[#8888a8] ml-13">Powered by Groq LLaMA — your personal music expert</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        {([['chat', Bot, 'Chat'], ['generate', Wand2, 'Generate Playlist']] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setMode(id as Mode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${mode === id ? 'bg-white text-black' : 'bg-[#0d0d1a] border border-[#1c1c33] text-[#8888a8] hover:text-white'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Chat mode */}
      {mode === 'chat' && (
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: '58vh' }}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'assistant' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-[#1c1c33] border border-[#3a3a58]'}`}>
                  {m.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-[#8888a8]" />}
                </div>
                <div className={`max-w-2xl flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-sm' : 'bg-[#121220] border border-[#1c1c33] text-[#f0f0f8] rounded-2xl rounded-tl-sm'}`}>
                    {m.content}
                  </div>
                  {m.songs?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                      {m.songs.map((s: Song, si: number) => <SongCard key={s.id + si} song={s} queue={m.songs} compact />)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
                <div className="bg-[#121220] border border-[#1c1c33] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">{[0, .15, .3].map(d => <div key={d} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${d}s` }} />)}</div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
            {CHAT_Q.map(q => (
              <button key={q} onClick={() => sendMsg(q)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#0d0d1a] border border-[#1c1c33] text-[#8888a8] hover:text-white hover:border-purple-500/50 transition-colors text-xs">{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder="Ask about music, request recommendations..."
              className="flex-1 bg-[#0d0d1a] border border-[#1c1c33] rounded-2xl px-5 py-3.5 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            <button onClick={() => sendMsg()} disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Generate mode */}
      {mode === 'generate' && (
        <div className="max-w-2xl">
          <div className="flex flex-wrap gap-2 mb-6">
            {QUICK.map(q => (
              <button key={q} onClick={() => setPrompt(q)}
                className={`px-3 py-2 rounded-xl text-sm transition-all border ${prompt === q ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' : 'bg-[#0d0d1a] border-[#1c1c33] text-[#8888a8] hover:text-white hover:border-purple-500/30'}`}>{q}</button>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[#8888a8] text-sm mb-2 block">Describe your playlist</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder='e.g. "Slow Telugu songs for a rainy evening" or "High energy gym tracks"' rows={3}
                className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-2xl px-5 py-4 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none" />
            </div>
            <div>
              <label className="text-[#8888a8] text-sm mb-2 block">Playlist name (optional)</label>
              <input type="text" value={plName} onChange={e => setPlName(e.target.value)} placeholder="Leave blank to auto-generate"
                className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-2xl px-5 py-3.5 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>
            <button onClick={genPlaylist} disabled={!prompt.trim() || loading}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Generating...' : 'Generate Playlist'}
            </button>
          </div>

          {generated && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <div className="glass-card rounded-2xl p-5 mb-5">
                <h3 className="text-white text-xl font-bold">{generated.playlist.name}</h3>
                {generated.playlist.description && <p className="text-[#8888a8] text-sm mt-1">{generated.playlist.description}</p>}
                <p className="text-[#8888a8] text-sm mt-2">{generated.songs.length} songs generated</p>
                {generated.analysis?.mood && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">{generated.analysis.mood}</span>
                    {generated.analysis.energy && <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs">{generated.analysis.energy} energy</span>}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {generated.songs.slice(0, 12).map((s: Song, i: number) => (
                  <motion.div key={s.id + i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                    <SongCard song={s} queue={generated.songs} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
