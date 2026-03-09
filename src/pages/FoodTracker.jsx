import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function FoodTracker() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [feedings, setFeedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cat_id: '',
    food_type: '',
    amount: '',
    fed_at: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [catsRes, feedingsRes] = await Promise.all([
        supabase.from('cats').select('*').eq('user_id', user.id).order('name'),
        supabase
          .from('feedings')
          .select('*, cats(name)')
          .eq('user_id', user.id)
          .order('fed_at', { ascending: false })
          .limit(50),
      ]);
      if (catsRes.data) setCats(catsRes.data);
      if (feedingsRes.data) setFeedings(feedingsRes.data);
    } catch (err) {
      console.error('Food tracker load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error: insertError } = await supabase.from('feedings').insert({
      user_id: user.id,
      cat_id: form.cat_id,
      food_type: form.food_type,
      amount: form.amount || null,
      fed_at: form.fed_at,
      notes: form.notes || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({
      cat_id: '',
      food_type: '',
      amount: '',
      fed_at: new Date().toISOString().slice(0, 16),
      notes: '',
    });
    setShowForm(false);
    loadData();
  }

  async function deleteFeeding(id) {
    if (!window.confirm('Delete this feeding record?')) return;
    const { error: deleteError } = await supabase.from('feedings').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    loadData();
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Food Tracker</h1>
          <p className="text-gray-600 mt-1">Track what and when your cats eat</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={cats.length === 0}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Log Feeding
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {cats.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          You need to add at least one cat before logging feedings. Go to <Link to="/cats" className="font-medium underline">My Cats</Link> first.
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Feeding</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Food Type *</label>
              <input
                required
                value={form.food_type}
                onChange={(e) => setForm({ ...form, food_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Wet food, Dry food, Treats..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="1/2 cup, 1 can..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={form.fed_at}
                onChange={(e) => setForm({ ...form, fed_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Optional notes..."
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Log Feeding
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

      {/* Feedings list */}
      {feedings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-5xl">🍽️</span>
          <p className="mt-4 text-gray-600">No feedings logged yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {feedings.map((f) => (
            <div key={f.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{f.cats?.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-700">{f.food_type}</span>
                  {f.amount && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500 text-sm">{f.amount}</span>
                    </>
                  )}
                </div>
                {f.notes && <p className="text-sm text-gray-500 mt-0.5">{f.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(f.fed_at).toLocaleString()}
                </span>
                <button
                  onClick={() => deleteFeeding(f.id)}
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
