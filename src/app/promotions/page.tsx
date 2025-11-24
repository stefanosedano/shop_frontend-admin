'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/context/LanguageContext';
import { API_URL, fetchWithAuth } from '@/lib/api';

interface Promotion {
  id: number;
  code: string;
  description: string | null;
  type: string;
  value: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  is_automatic: boolean;
  minimum_purchase_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_promotions: number;
  active_promotions: number;
  expired_promotions: number;
  total_usage: number;
  total_discount_amount: number;
}

export default function PromotionsAdminPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch promotions
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('is_active', filter === 'active' ? 'true' : 'false');
      }

      const [promotionsRes, statsRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/admin/promotions?${params}`),
        fetchWithAuth(`${API_URL}/admin/promotions/stats/overview`),
      ]);

      if (promotionsRes.ok && statsRes.ok) {
        setPromotions(await promotionsRes.json());
        setStats(await statsRes.json());
      } else if (promotionsRes.status === 401 || statsRes.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePromotionStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/admin/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
    }
  };

  const deletePromotion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await fetchWithAuth(`${API_URL}/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'free_shipping':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-medium text-gray-900">Promotions</h1>
          <Link
            href="/promotions/create"
            className="btn-primary"
          >
            + Add Promotion
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Promotions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_promotions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active_promotions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expired_promotions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Uses</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total_usage}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Discounts</p>
              <p className="text-2xl font-bold text-purple-600">
                ${stats.total_discount_amount.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md ${
              filter === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-md ${
              filter === 'inactive'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No promotions found
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{promo.code}</p>
                      <p className="text-sm text-gray-500">{promo.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(promo.type)}`}>
                      {promo.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {promo.type === 'percentage' && `${promo.value}%`}
                    {promo.type === 'fixed' && `$${promo.value}`}
                    {promo.type === 'free_shipping' && 'Free Shipping'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {promo.usage_count}
                    {promo.usage_limit && ` / ${promo.usage_limit}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <p>Start: {formatDate(promo.starts_at)}</p>
                      {promo.ends_at && <p>End: {formatDate(promo.ends_at)}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        promo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/promotions/${promo.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => togglePromotionStatus(promo.id, promo.is_active)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {promo.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deletePromotion(promo.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </AdminLayout>
  );
}
