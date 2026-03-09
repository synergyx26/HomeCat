import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ cats: 0, feedings: 0, healthLogs: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadStats();
    }
  }, [user?.id]);

  async function loadProfile() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
    setLoading(false);
  }

  async function loadStats() {
    const [catsRes, feedingsRes, healthRes] = await Promise.all([
      supabase.from('cats').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('feedings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('health_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    setStats({
      cats: catsRes.count || 0,
      feedings: feedingsRes.count || 0,
      healthLogs: healthRes.count || 0,
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (profileError) {
      setMessage(profileError.message);
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({ data: { full_name: fullName } });

    setProfile({ ...profile, full_name: fullName });
    setEditing(false);
    setMessage('Profile updated successfully.');
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = profile?.email || user?.email || '';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.includes('success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cat-100 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              '👤'
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  placeholder="Your name"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-xs font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setFullName(profile?.full_name || ''); }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{displayName || 'No name set'}</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500">{email}</p>
            <div className="flex items-center gap-2 mt-1">
              {isAdmin && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
              {memberSince && (
                <span className="text-xs text-gray-400">Member since {memberSince}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.cats}</p>
          <p className="text-sm text-gray-500">Cats</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.feedings}</p>
          <p className="text-sm text-gray-500">Feedings</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.healthLogs}</p>
          <p className="text-sm text-gray-500">Health Logs</p>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Details</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Auth Provider</dt>
            <dd className="text-gray-900 capitalize">{user?.app_metadata?.provider || 'email'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">User ID</dt>
            <dd className="text-gray-900 font-mono text-xs">{user?.id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
