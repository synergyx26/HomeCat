import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Cats() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({ name: '', breed: '', age: '', weight: '', notes: '' });

  useEffect(() => {
    if (user?.id) loadCats();
  }, [user?.id]);

  async function loadCats() {
    setLoading(true);
    const { data } = await supabase
      .from('cats')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (data) setCats(data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: '', breed: '', age: '', weight: '', notes: '' });
    setEditingCat(null);
    setShowForm(false);
  }

  function editCat(cat) {
    setForm({
      name: cat.name || '',
      breed: cat.breed || '',
      age: cat.age?.toString() || '',
      weight: cat.weight?.toString() || '',
      notes: cat.notes || '',
    });
    setEditingCat(cat);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      user_id: user.id,
      name: form.name,
      breed: form.breed || null,
      age: form.age ? parseInt(form.age) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      notes: form.notes || null,
    };

    const { error: mutationError } = editingCat
      ? await supabase.from('cats').update(payload).eq('id', editingCat.id)
      : await supabase.from('cats').insert(payload);

    if (mutationError) {
      setError(mutationError.message);
      return;
    }

    resetForm();
    loadCats();
  }

  async function deleteCat(id) {
    if (!window.confirm('Are you sure you want to remove this cat? This will also delete all related feeding and health records.')) return;
    setError('');
    const { error: deleteError } = await supabase.from('cats').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    loadCats();
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
          <h1 className="text-2xl font-bold text-gray-900">My Cats</h1>
          <p className="text-gray-600 mt-1">Manage your cat profiles</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          + Add Cat
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCat ? 'Edit Cat' : 'Add New Cat'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Whiskers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Persian"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
              <input
                type="number"
                min="0"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="4.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Any special notes about your cat..."
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                {editingCat ? 'Update Cat' : 'Add Cat'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cats list */}
      {cats.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-5xl">🐱</span>
          <p className="mt-4 text-gray-600">No cats added yet. Click "Add Cat" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cat-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    🐱
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-sm text-gray-500">{cat.breed || 'Unknown breed'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                {cat.age != null && <p>Age: {cat.age} years</p>}
                {cat.weight != null && <p>Weight: {cat.weight} kg</p>}
                {cat.notes && <p className="text-gray-500 italic">{cat.notes}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => editCat(cat)}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCat(cat.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
