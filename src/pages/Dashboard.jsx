import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let years = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) years--;
  if (years < 1) {
    let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    if (today.getDate() < dob.getDate()) months--;
    return months <= 0 ? 'Under 1 month' : `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${years} year${years === 1 ? '' : 's'}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [recentFeedings, setRecentFeedings] = useState([]);
  const [recentHealth, setRecentHealth] = useState([]);
  const [feedingsCount, setFeedingsCount] = useState(0);
  const [healthCount, setHealthCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadDashboardData();
  }, [user?.id]);

  async function loadDashboardData() {
    setLoading(true);
    const [catsRes, feedingsRes, healthRes, feedingsCountRes, healthCountRes] = await Promise.all([
      supabase
        .from('cats')
        .select('*')
        .eq('user_id', user.id)
        .order('name'),
      supabase
        .from('feedings')
        .select('*, cats(name)')
        .eq('user_id', user.id)
        .order('fed_at', { ascending: false })
        .limit(5),
      supabase
        .from('health_logs')
        .select('*, cats(name)')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(5),
      supabase
        .from('feedings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('health_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    if (catsRes.data) setCats(catsRes.data);
    if (feedingsRes.data) setRecentFeedings(feedingsRes.data);
    if (healthRes.data) setRecentHealth(healthRes.data);
    setFeedingsCount(feedingsCountRes.count ?? 0);
    setHealthCount(healthCountRes.count ?? 0);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your cats.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cat-100 rounded-lg">
              <span className="text-xl">🐱</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{cats.length}</p>
              <p className="text-sm text-gray-500">Total Cats</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <span className="text-xl">🍽️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{feedingsCount}</p>
              <p className="text-sm text-gray-500">Total Feedings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl">💊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{healthCount}</p>
              <p className="text-sm text-gray-500">Health Entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cats overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Cats</h2>
          <Link
            to="/cats"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Manage Cats →
          </Link>
        </div>
        {cats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <span className="text-4xl">🐱</span>
            <p className="mt-3 text-gray-600">No cats yet! Add your first cat to get started.</p>
            <Link
              to="/cats"
              className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
            >
              Add a Cat
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cats.map((cat) => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cat-100 rounded-full flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      '🐱'
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-sm text-gray-500">
                      {cat.breed || 'Unknown breed'} · {cat.date_of_birth ? calculateAge(cat.date_of_birth) : 'Age unknown'}
                    </p>
                  </div>
                </div>
                {cat.weight && (
                  <p className="mt-3 text-sm text-gray-500">Weight: {cat.weight} kg</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent feedings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Feedings</h2>
          <Link
            to="/food"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>
        {recentFeedings.length === 0 ? (
          <p className="text-gray-500 text-sm">No feedings recorded yet.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {recentFeedings.map((f) => (
              <div key={f.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{f.cats?.name}</span>
                  <span className="text-gray-500 ml-2 text-sm">
                    {f.food_type}{f.amount ? ` — ${f.amount}` : ''}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(f.fed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
