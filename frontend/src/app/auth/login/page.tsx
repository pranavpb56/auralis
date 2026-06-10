'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      setUser(data.user); setToken(data.token);
      toast.success(`Welcome back, ${data.user.display_name || data.user.username}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/3 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Auralis</span>
          </Link>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Welcome back</h1>
          <p className="text-[#8888a8] mt-2">Sign in to continue your musical journey</p>
        </div>
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888a8]" />
              <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3.5 pl-11 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888a8]" />
              <input type={show ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3.5 pl-11 pr-11 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8888a8] hover:text-white transition-colors">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span> : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-[#8888a8] text-sm mt-6">
          Don't have an account? <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}
