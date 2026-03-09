import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CAT_COLORS = [
  'Black', 'White', 'Orange/Ginger', 'Gray/Blue', 'Brown', 'Cream',
  'Calico', 'Tabby', 'Tuxedo', 'Tortoiseshell', 'Siamese', 'Bicolor', 'Other',
];

const CAT_GENDERS = ['Male', 'Female', 'Unknown'];
const INDOOR_OUTDOOR_OPTIONS = ['Indoor', 'Outdoor', 'Both'];

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

const emptyForm = {
  name: '', breed: '', date_of_birth: '', weight: '', color: '',
  gender: '', chip_id: '', indoor_outdoor: '', notes: '',
};

export default function Cats() {
  const { user } = useAuth();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    setForm(emptyForm);
    setEditingCat(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  }

  function editCat(cat) {
    setForm({
      name: cat.name || '',
      breed: cat.breed || '',
      date_of_birth: cat.date_of_birth || '',
      weight: cat.weight?.toString() || '',
      color: cat.color || '',
      gender: cat.gender || '',
      chip_id: cat.chip_id || '',
      indoor_outdoor: cat.indoor_outdoor || '',
      notes: cat.notes || '',
    });
    setImagePreview(cat.image_url || null);
    setImageFile(null);
    setEditingCat(cat);
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(catId) {
    if (!imageFile) return null;
    const ext = imageFile.name.split('.').pop();
    const path = `${user.id}/${catId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('cat-images')
      .upload(path, imageFile, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('cat-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      const payload = {
        user_id: user.id,
        name: form.name,
        breed: form.breed || null,
        date_of_birth: form.date_of_birth || null,
        weight: form.weight ? parseFloat(form.weight) : null,
        color: form.color || null,
        gender: form.gender || null,
        chip_id: form.chip_id || null,
        indoor_outdoor: form.indoor_outdoor || null,
        notes: form.notes || null,
      };

      if (editingCat) {
        if (imageFile) {
          const imageUrl = await uploadImage(editingCat.id);
          if (imageUrl) payload.image_url = imageUrl;
        }
        const { error: updateError } = await supabase.from('cats').update(payload).eq('id', editingCat.id);
        if (updateError) { setError(updateError.message); return; }
      } else {
        const { data: newCat, error: insertError } = await supabase.from('cats').insert(payload).select().single();
        if (insertError) { setError(insertError.message); return; }
        if (imageFile && newCat) {
          const imageUrl = await uploadImage(newCat.id);
          if (imageUrl) {
            await supabase.from('cats').update({ image_url: imageUrl }).eq('id', newCat.id);
          }
        }
      }

      resetForm();
      loadCats();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
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

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white";
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none";

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
            {/* Image upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-cat-100 flex items-center justify-center flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🐱</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP. Max 5MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Whiskers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className={inputClass}
                placeholder="Persian"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className={inputClass}
                max={new Date().toISOString().split('T')[0]}
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
                className={inputClass}
                placeholder="4.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <select
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className={selectClass}
              >
                <option value="">Select color...</option>
                {CAT_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={selectClass}
              >
                <option value="">Select gender...</option>
                {CAT_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Microchip ID</label>
              <input
                value={form.chip_id}
                onChange={(e) => setForm({ ...form, chip_id: e.target.value })}
                className={inputClass}
                placeholder="e.g. 900123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indoor / Outdoor</label>
              <select
                value={form.indoor_outdoor}
                onChange={(e) => setForm({ ...form, indoor_outdoor: e.target.value })}
                className={selectClass}
              >
                <option value="">Select...</option>
                {INDOOR_OUTDOOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={inputClass}
                placeholder="Any special notes about your cat..."
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium disabled:opacity-50"
              >
                {uploading ? 'Saving...' : editingCat ? 'Update Cat' : 'Add Cat'}
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
          {cats.map((cat) => {
            const age = calculateAge(cat.date_of_birth);
            return (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cat-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        '🐱'
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <p className="text-sm text-gray-500">{cat.breed || 'Unknown breed'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  {age != null && <p>Age: {age}</p>}
                  {cat.date_of_birth && <p>Born: {new Date(cat.date_of_birth).toLocaleDateString()}</p>}
                  {cat.weight != null && <p>Weight: {cat.weight} kg</p>}
                  {cat.color && <p>Color: {cat.color}</p>}
                  {cat.gender && <p>Gender: {cat.gender}</p>}
                  {cat.chip_id && <p>Chip ID: {cat.chip_id}</p>}
                  {cat.indoor_outdoor && <p>Lifestyle: {cat.indoor_outdoor}</p>}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
