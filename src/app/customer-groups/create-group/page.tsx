'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, fetchWithAuth } from '@/lib/api';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metadata: '{}'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse metadata JSON
      let metadata = null;
      if (formData.metadata.trim()) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch (err) {
          alert('Invalid JSON in metadata field');
          setLoading(false);
          return;
        }
      }

      const res = await fetchWithAuth(`${API_URL}/admin/customer-groups/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          metadata_: metadata
        })
      });

      if (res.ok) {
        router.push('/customer-groups');
      } else {
        const error = await res.json();
        alert(`Failed to create group: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/customer-groups" className="text-blue-600 hover:text-blue-800">
          ← Back to Customer Groups
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Customer Group</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., VIP Customers, Wholesale Partners"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe this customer group..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metadata (JSON)
            </label>
            <textarea
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={5}
              placeholder='{"discount_percentage": 10, "priority_support": true}'
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional JSON data for custom attributes
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
            <Link
              href="/customer-groups"
              className="btn-secondary flex-1 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Customer Groups</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Manually assign customers to groups for special treatment</li>
          <li>• Use groups for exclusive pricing and promotions</li>
          <li>• Perfect for B2B customers, VIP members, or wholesale partners</li>
          <li>• After creation, add customers through the group management page</li>
        </ul>
      </div>
      </div>
    </AdminLayout>
  );
}
