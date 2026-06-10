'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Bell, Music, Shield, LogOut } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const Toggle = ({ v, onChange }: { v: boolean; onChange: (b: boolean) => void }) => (
  <button onClick={() => onChange(!v)} className={`relative w-11 h-6 rounded-full transition-colors ${v ? 'bg-purple-600' : 'bg-[#3a3a58]'}`}>
    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${v ? 'translate-x-5' : ''}`} />
  </button>
);

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const [section, setSection] = useState('profile');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState('');
  const [autoplay, setAutoplay] = useState(true);
  const [normalize, setNormalize] = useState(true);
  const [explicit, setExplicit] = useState(true);
  const [crossfade, setCrossfade] = useState(3);
  const [emailNotif, setEmailNotif] = useState(true);

  const profileMutation = useMutation({
    mutationFn: () => usersAPI.update({ displayName, bio }),
    onSuccess: ({ data }) => { setUser({ ...user!, ...data }); toast.success('Profile updated!'); },
    onError: () => toast.error('Update failed'),
  });

  const NAV = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'playback', label: 'Playback', icon: Music },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="min-h-full px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Georgia, serif' }}>Settings</h1>
      <div className="flex gap-8">
        {/* Nav */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${section === id ? 'bg-white/10 text-white' : 'text-[#8888a8] hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
          <div className="pt-4 border-t border-[#1c1c33] mt-4">
            <button onClick={() => { logout(); router.push('/auth/login'); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" />Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-lg">
          {section === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h2 className="text-xl font-bold text-white">Profile</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                  {(user?.display_name || user?.username || 'A')[0].toUpperCase()}
                </div>
                <div><p className="text-white font-medium">{user?.username}</p><p className="text-[#8888a8] text-sm">{user?.email}</p></div>
              </div>
              <div>
                <label className="text-[#8888a8] text-sm mb-2 block">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" />
              </div>
              <div>
                <label className="text-[#8888a8] text-sm mb-2 block">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell people about yourself..."
                  className="w-full bg-[#0d0d1a] border border-[#1c1c33] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none" />
              </div>
              <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                <Save className="w-4 h-4" />{profileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}
          {section === 'playback' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h2 className="text-xl font-bold text-white">Playback</h2>
              <div className="glass-card rounded-2xl p-6 space-y-5">
                {[['Autoplay similar content', 'Keep music going after playlist ends', autoplay, setAutoplay], ['Normalize volume', 'Same volume for all tracks', normalize, setNormalize], ['Allow explicit content', 'Show explicit songs in results', explicit, setExplicit]].map(([label, desc, v, fn]: any) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <div><p className="text-white text-sm font-medium">{label}</p><p className="text-[#8888a8] text-xs mt-0.5">{desc}</p></div>
                    <Toggle v={v} onChange={fn} />
                  </div>
                ))}
                <div>
                  <div className="flex justify-between mb-2"><p className="text-white text-sm font-medium">Crossfade</p><span className="text-purple-400 text-sm">{crossfade}s</span></div>
                  <input type="range" min={0} max={12} step={1} value={crossfade} onChange={e => setCrossfade(+e.target.value)} className="w-full accent-purple-500" />
                </div>
              </div>
              <button onClick={() => toast.success('Settings saved!')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity">
                <Save className="w-4 h-4" />Save Settings
              </button>
            </motion.div>
          )}
          {section === 'notifications' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-white text-sm font-medium">Email notifications</p><p className="text-[#8888a8] text-xs mt-0.5">Receive updates via email</p></div>
                  <Toggle v={emailNotif} onChange={setEmailNotif} />
                </div>
              </div>
              <button onClick={() => toast.success('Saved!')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:opacity-90"><Save className="w-4 h-4" />Save</button>
            </motion.div>
          )}
          {section === 'privacy' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h2 className="text-xl font-bold text-white">Privacy</h2>
              <div className="glass-card rounded-2xl p-4 text-[#8888a8] text-sm space-y-2">
                <p className="text-white font-medium">Your data stays on your machine</p>
                <p>Auralis stores everything locally in a SQLite database file at <code className="text-purple-300 bg-purple-500/10 px-1 rounded">data/auralis.db</code>.</p>
                <p>No data is sent to any third party except Groq AI (for AI features) and Apple iTunes API (for music search).</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
