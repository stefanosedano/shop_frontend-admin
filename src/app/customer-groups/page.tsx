'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';

interface CustomerGroup {
  id: number;
  name: string;
  description: string | null;
  metadata_: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  customer_count?: number;
}

interface CustomerSegment {
  id: number;
  name: string;
  description: string | null;
  rules: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  customer_count?: number;
}

interface Stats {
  total_groups: number;
  total_segments: number;
  total_customers_in_groups: number;
  total_customers_in_segments: number;
}

export default function CustomerGroupsAdminPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'groups' | 'segments'>('groups');
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch groups
      const groupsRes = await fetch('http://localhost:8001/api/v1/admin/customer-groups/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }

      // Fetch segments
      const segmentsRes = await fetch('http://localhost:8001/api/v1/admin/customer-groups/segments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json();
        setSegments(segmentsData);
      }

      // Fetch stats
      const statsRes = await fetch('http://localhost:8001/api/v1/admin/customer-groups/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    }
  };

  const deleteSegment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/segments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete segment');
      }
    } catch (error) {
      console.error('Error deleting segment:', error);
      alert('Error deleting segment');
    }
  };

  const updateAllSegments = async () => {
    if (!confirm('This will recalculate all segment memberships. Continue?')) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('http://localhost:8001/api/v1/admin/customer-groups/segments/update-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Updated ${result.segments_processed} segments, ${result.total_added} customers added, ${result.total_removed} removed`);
        fetchData();
      } else {
        alert('Failed to update segments');
      }
    } catch (error) {
      console.error('Error updating segments:', error);
      alert('Error updating segments');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900">{t.customerGroups.title}</h1>
            <div className="flex gap-2">
              <Link
                href="/customer-groups/create-group"
                className="btn-primary"
              >
                {t.customerGroups.createGroup}
              </Link>
              <Link
                href="/customer-groups/create-segment"
                className="btn-secondary"
              >
                {t.customerGroups.createSegment}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.customerGroups.totalGroups}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_groups}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.customerGroups.totalSegments}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_segments}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.customerGroups.inGroups}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_customers_in_groups}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.customerGroups.inSegments}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total_customers_in_segments}</dd>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('groups')}
                className={`${
                  activeTab === 'groups'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Customer Groups
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'groups' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-900'
                }`}>
                  {groups.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('segments')}
                className={`${
                  activeTab === 'segments'
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Dynamic Segments
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'segments' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-900'
                }`}>
                  {segments.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'groups' ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Customer groups are manually assigned collections. Use them for special pricing, exclusive promotions, or VIP treatment.
                </p>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No groups</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new customer group.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {groups.map((group) => (
                      <div key={group.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {group.customer_count || 0} members
                              </span>
                            </div>
                            {group.description && (
                              <p className="mt-1 text-sm text-gray-500">{group.description}</p>
                            )}
                            <div className="mt-2 flex items-center text-xs text-gray-400">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Created {new Date(group.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <Link
                              href={`/customer-groups/${group.id}`}
                              className="btn-ghost txt-compact-small"
                            >
                              Manage
                            </Link>
                            <Link
                              href={`/customer-groups/${group.id}/edit`}
                              className="btn-ghost txt-compact-small"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => deleteGroup(group.id)}
                              className="btn-ghost txt-compact-small text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm text-gray-600">
                    Dynamic segments automatically include customers based on rules. They update automatically.
                  </p>
                  <button
                    onClick={updateAllSegments}
                    disabled={updating}
                    className="btn-primary txt-compact-small"
                  >
                    <svg className={`-ml-0.5 mr-2 h-4 w-4 ${updating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {updating ? 'Updating...' : 'Update All'}
                  </button>
                </div>
                {segments.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No segments</h3>
                    <p className="mt-1 text-sm text-gray-500">Create a segment to automatically group customers.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {segments.map((segment) => (
                      <div key={segment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900">{segment.name}</h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                segment.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {segment.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {segment.customer_count || 0} members
                              </span>
                              <span className="text-xs text-gray-400">Priority {segment.priority}</span>
                            </div>
                            {segment.description && (
                              <p className="mt-1 text-sm text-gray-500">{segment.description}</p>
                            )}
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-500">Rules:</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {Object.entries(segment.rules).map(([key, value]: [string, any]) => (
                                  <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700">
                                    {key.replace(/_/g, ' ')} {value.operator} {value.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center text-xs text-gray-400">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Created {new Date(segment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <Link
                              href={`/customer-groups/segment/${segment.id}`}
                              className="btn-ghost txt-compact-small"
                            >
                              View
                            </Link>
                            <Link
                              href={`/customer-groups/segment/${segment.id}/edit`}
                              className="btn-ghost txt-compact-small"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => deleteSegment(segment.id)}
                              className="btn-ghost txt-compact-small text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
