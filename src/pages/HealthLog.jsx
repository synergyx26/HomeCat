import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function HealthLog() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cat_id: '',
    log_type: 'vet_visit',
    log_date: new Date().toISOString().slice(0, 10),
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [catsRes, logsRes] = await Promise.all([
        supabase.from('cats').select('*').eq('user_id', user.id).order('name'),
        supabase
          .from('health_logs')
          .select('*, cats(name)')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
          .limit(50),
      ]);
      if (catsRes.data) setCats(catsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (err) {
      console.error('Health log load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error: insertError } = await supabase.from('health_logs').insert({
      user_id: user.id,
      cat_id: form.cat_id,
      log_type: form.log_type,
      log_date: form.log_date,
      description: form.description,
      notes: form.notes || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({
      cat_id: '',
      log_type: 'vet_visit',
      log_date: new Date().toISOString().slice(0, 10),
      description: '',
      notes: '',
    });
    setShowForm(false);
    loadData();
  }

  async function deleteLog(id) {
    if (!window.confirm('Delete this health log entry?')) return;
    const { error: deleteError } = await supabase.from('health_logs').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    loadData();
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Log</h1>
          <p className="text-gray-600 mt-1">Track vet visits, medications, and health events</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={cats.length === 0}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Entry
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {cats.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          You need to add at least one cat before logging health entries. Go to <Link to="/cats" className="font-medium underline">My Cats</Link> first.
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Health Entry</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cat *</label>
              <select
                required
                value={form.cat_id}
                onChange={(e) => setForm({ ...form, cat_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Select a cat</option>
                {cats.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                required
                value={form.log_type}
                onChange={(e) => setForm({ ...form, log_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {Object.entries(logTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.log_date}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Annual checkup, Rabies vaccine..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Additional details..."
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Add Entry
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Health logs list */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-5xl">💊</span>
          <p className="mt-4 text-gray-600">No health entries logged yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="px-5 py-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{log.cats?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${logTypeColors[log.log_type] || logTypeColors.other}`}>
                    {logTypeLabels[log.log_type] || log.log_type}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mt-1">{log.description}</p>
                {log.notes && <p className="text-sm text-gray-500 mt-0.5">{log.notes}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.log_date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
