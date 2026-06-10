'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck, Music2, Users } from 'lucide-react';
import Link from 'next/link';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersAPI.byUsername(username).then(r => r.data),
  });

  const followMutation = useMutation({
    mutationFn: () => usersAPI.follow(profile.id),
    onSuccess: ({ data }: any) => {
      qc.invalidateQueries({ queryKey: ['profile', username] });
      toast.success(data.following ? `Following ${profile.display_name || profile.username}` : 'Unfollowed');
    },
  });

  const isMe = me?.username === username;

  if (isLoading) return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex gap-6">
        <div className="skeleton w-28 h-28 rounded-3xl flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="skeleton h-7 w-1/3 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex items-center justify-center min-h-full">
      <div className="text-center">
        <Users className="w-16 h-16 text-[#8888a8] mx-auto mb-4" />
        <p className="text-white text-xl font-semibold">User not found</p>
        <p className="text-[#8888a8] mt-2">@{username} doesn't exist</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative px-8 pt-8 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-[#07070f] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold flex-shrink-0 shadow-2xl">
            {(profile.display_name || profile.username)?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              {profile.display_name || profile.username}
            </h1>
            <p className="text-[#8888a8] mt-1">@{profile.username}</p>
            {profile.bio && <p className="text-[#8888a8] text-sm mt-2 max-w-md leading-relaxed">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-[#8888a8]">
              <span><strong className="text-white">{profile._count?.followers || 0}</strong> followers</span>
              <span><strong className="text-white">{profile._count?.following || 0}</strong> following</span>
              <span><strong className="text-white">{profile._count?.playlists || 0}</strong> playlists</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isMe ? (
              <Link href="/settings"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1c1c33] text-white text-sm font-medium hover:bg-white/5 transition-colors">
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1c1c33] text-white text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50">
                <UserPlus className="w-4 h-4" /> Follow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Playlists */}
      <div className="px-8 pb-10">
        <h2 className="text-xl font-bold text-white mb-4">Public Playlists</h2>
        {!profile.playlists || profile.playlists.length === 0 ? (
          <div className="text-center py-12">
            <Music2 className="w-12 h-12 text-[#8888a8] mx-auto mb-3" />
            <p className="text-[#8888a8]">No public playlists yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {profile.playlists.map((pl: any, i: number) => (
              <motion.div key={pl.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/playlist/${pl.id}`} className="block glass-card glass-hover rounded-2xl p-4 group">
                  <div className="aspect-square rounded-xl mb-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Music2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{pl.name}</p>
                  <p className="text-[#8888a8] text-xs mt-1">{pl._count?.songs || pl.song_count || 0} songs</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
