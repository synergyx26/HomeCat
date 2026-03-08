import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [allCats, setAllCats] = useState([]);
  const [allFeedings, setAllFeedings] = useState([]);
  const [allHealthLogs, setAllHealthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isAdmin) loadAdminData();
  }, [isAdmin]);

  async function loadAdminData() {
    setLoading(true);
    const [profilesRes, catsRes, feedingsRes, healthRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('cats').select('*').order('created_at', { ascending: false }),
      supabase.from('feedings').select('*, cats(name)').order('fed_at', { ascending: false }).limit(100),
      supabase.from('health_logs').select('*, cats(name)').order('log_date', { ascending: false }).limit(100),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (catsRes.data) setAllCats(catsRes.data);
    if (feedingsRes.data) setAllFeedings(feedingsRes.data);
    if (healthRes.data) setAllHealthLogs(healthRes.data);
    setLoading(false);
  }

  async function toggleAdmin(profileId, currentStatus) {
    if (profileId === user.id) return;
    await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', profileId);
    loadAdminData();
  }

  const logTypeLabels = {
    vet_visit: 'Vet Visit',
    vaccination: 'Vaccination',
    medication: 'Medication',
    symptom: 'Symptom',
    weight_check: 'Weight Check',
    other: 'Other',
  };

  const logTypeColors = {
    vet_visit: 'bg-blue-100 text-blue-700',
    vaccination: 'bg-green-100 text-green-700',
    medication: 'bg-purple-100 text-purple-700',
    symptom: 'bg-red-100 text-red-700',
    weight_check: 'bg-yellow-100 text-yellow-700',
    other: 'bg-gray-100 text-gray-700',
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'cats', label: 'All Cats' },
    { id: 'feedings', label: 'All Feedings' },
    { id: 'health', label: 'All Health Logs' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage users and view all app data</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{profiles.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Cats</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{allCats.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Feedings</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{allFeedings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Health Logs</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{allHealthLogs.length}</p>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Joined</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-5 py-3 text-gray-900">
                      {profile.email}
                      {profile.id === user.id && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        profile.is_admin
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {profile.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {profile.id !== user.id && (
                        <button
                          onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                          className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                            profile.is_admin
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          }`}
                        >
                          {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Cats */}
      {activeTab === 'cats' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {allCats.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No cats registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Breed</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Age</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Weight</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allCats.map((cat) => (
                    <tr key={cat.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-5 py-3 text-gray-600">{cat.breed || '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{cat.age != null ? `${cat.age} yrs` : '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{cat.weight != null ? `${cat.weight} kg` : '-'}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(cat.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Feedings */}
      {activeTab === 'feedings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {allFeedings.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No feedings recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Cat</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Food</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allFeedings.map((f) => (
                    <tr key={f.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{f.cats?.name || '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{f.food_type}</td>
                      <td className="px-5 py-3 text-gray-600">{f.amount || '-'}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(f.fed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Health Logs */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {allHealthLogs.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No health logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Cat</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Description</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allHealthLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{log.cats?.name || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${logTypeColors[log.log_type] || logTypeColors.other}`}>
                          {logTypeLabels[log.log_type] || log.log_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{log.description}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(log.log_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
