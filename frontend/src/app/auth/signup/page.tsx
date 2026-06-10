'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      setUser(data.user); setToken(data.token);
      toast.success('Welcome to Auralis! 🎵');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const F = ({ icon: Icon, type, placeholder, field, extra = {} }: any) => (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888a8]" />
      <input type={type} placeholder={placeholder} value={(form as any)[field]} onChange={(e: any) => setForm(f => ({ ...f, [field]: e.target.value }))}
        className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3.5 pl-11 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm"
        {...extra} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Auralis</span>
          </Link>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Create your account</h1>
          <p className="text-[#8888a8] mt-2">Start your musical journey today</p>
        </div>
        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <F icon={Mail} type="email" placeholder="Email address" field="email" extra={{ required: true }} />
            <F icon={User} type="text" placeholder="Username (letters, numbers, _)" field="username" extra={{ required: true, pattern: '^[a-zA-Z0-9_]+$' }} />
            <F icon={User} type="text" placeholder="Display name" field="displayName" />
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888a8]" />
              <input type={show ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8}
                className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3.5 pl-11 pr-11 text-white placeholder-[#8888a8] focus:outline-none focus:border-purple-500 transition-colors text-sm" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8888a8] hover:text-white transition-colors">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-[#8888a8] text-sm mt-6">
          Already have an account? <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
