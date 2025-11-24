'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, fetchWithAuth } from '@/lib/api';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

interface Rule {
  field: string;
  operator: string;
  value: string;
}

export default function CreateSegmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    priority: 0
  });
  const [rules, setRules] = useState<Rule[]>([
    { field: 'order_count', operator: 'gte', value: '' }
  ]);

  const fieldOptions = [
    { value: 'order_count', label: 'Order Count' },
    { value: 'total_spent', label: 'Total Spent' },
    { value: 'avg_order_value', label: 'Average Order Value' },
    { value: 'days_since_last_order', label: 'Days Since Last Order' },
    { value: 'days_as_customer', label: 'Days as Customer' }
  ];

  const operatorOptions = [
    { value: 'gt', label: 'Greater Than (>)' },
    { value: 'gte', label: 'Greater Than or Equal (≥)' },
    { value: 'lt', label: 'Less Than (<)' },
    { value: 'lte', label: 'Less Than or Equal (≤)' },
    { value: 'eq', label: 'Equal (=)' }
  ];

  const addRule = () => {
    setRules([...rules, { field: 'order_count', operator: 'gte', value: '' }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build rules object
      const rulesObject: Record<string, any> = {};
      rules.forEach(rule => {
        if (rule.value.trim()) {
          rulesObject[rule.field] = {
            operator: rule.operator,
            value: parseFloat(rule.value)
          };
        }
      });

      if (Object.keys(rulesObject).length === 0) {
        alert('Please add at least one rule with a value');
        setLoading(false);
        return;
      }

      const res = await fetchWithAuth(`${API_URL}/admin/customer-groups/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          rules: rulesObject,
          is_active: formData.is_active,
          priority: formData.priority
        })
      });

      if (res.ok) {
        router.push('/customer-groups');
      } else {
        const error = await res.json();
        alert(`Failed to create segment: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      alert('Error creating segment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/customer-groups" className="text-blue-600 hover:text-blue-800">
          ← Back to Customer Groups
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Dynamic Segment</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., High Value Customers, At Risk"
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
              placeholder="Describe this segment and its purpose..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Higher priority segments are evaluated first</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Segment Rules *
              </label>
              <button
                type="button"
                onClick={addRule}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Rule
              </button>
            </div>

            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(index, 'field', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fieldOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(index, 'operator', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {operatorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              All rules must be satisfied for a customer to be in this segment (AND logic)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Segment'}
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

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">💡 Dynamic Segments</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Customers are automatically added/removed based on rules</li>
          <li>• Rules evaluate customer order history and behavior</li>
          <li>• Perfect for targeting high-value, at-risk, or new customers</li>
          <li>• Segments update automatically - no manual management needed</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">📋 Rule Examples</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <div>
            <strong>High Value Customers:</strong> total_spent ≥ 1000
          </div>
          <div>
            <strong>Frequent Buyers:</strong> order_count ≥ 10
          </div>
          <div>
            <strong>At Risk:</strong> days_since_last_order &gt; 90
          </div>
          <div>
            <strong>Big Spenders:</strong> avg_order_value ≥ 200
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
