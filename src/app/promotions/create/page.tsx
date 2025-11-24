'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, fetchWithAuth } from '@/lib/api';

export default function CreatePromotionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    usage_limit: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
    is_automatic: false,
    minimum_purchase_amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: formData.value ? parseFloat(formData.value) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        minimum_purchase_amount: formData.minimum_purchase_amount
          ? parseFloat(formData.minimum_purchase_amount)
          : null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        rules: [],
        product_ids: [],
        category_ids: [],
      };

      const response = await fetchWithAuth(`${API_URL}/admin/promotions/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/promotions');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create promotion');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Promotion</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="e.g., SAVE20"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be automatically converted to uppercase
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe this promotion..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Type and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                  <option value="buy_x_get_y">Buy X Get Y</option>
                </select>
              </div>

              {formData.type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value {formData.type === 'percentage' && '(%)'}
                    {formData.type === 'fixed' && '($)'}
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder={formData.type === 'percentage' ? '10' : '50.00'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="ends_at"
                  value={formData.ends_at}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleChange}
                  min="0"
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Purchase ($)
                </label>
                <input
                  type="number"
                  name="minimum_purchase_amount"
                  value={formData.minimum_purchase_amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_automatic"
                  checked={formData.is_automatic}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Automatic (apply automatically if conditions are met)
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Promotion'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
