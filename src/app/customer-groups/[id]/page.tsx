'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';

interface CustomerGroup {
  id: number;
  name: string;
  description: string | null;
  metadata_: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface GroupPricing {
  id: number;
  product_id: number;
  price: number;
  created_at: string;
  product?: {
    name: string;
    base_price: number;
  };
}

export default function ManageGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [members, setMembers] = useState<Customer[]>([]);
  const [pricing, setPricing] = useState<GroupPricing[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [pricingForm, setPricingForm] = useState({ product_id: '', price: '' });

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch group details
      const groupRes = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (groupRes.ok) {
        setGroup(await groupRes.json());
      }

      // Fetch group members
      const membersRes = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${groupId}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (membersRes.ok) {
        setMembers(await membersRes.json());
      }

      // Fetch group pricing
      const pricingRes = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${groupId}/pricing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pricingRes.ok) {
        setPricing(await pricingRes.json());
      }

      // Fetch all customers for adding
      const customersRes = await fetch('http://localhost:8001/api/v1/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (customersRes.ok) {
        setAllCustomers(await customersRes.json());
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedCustomer) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${groupId}/customers/${selectedCustomer}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
        setShowAddMember(false);
        setSelectedCustomer('');
      } else {
        alert('Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const removeMember = async (customerId: number) => {
    if (!confirm('Remove this customer from the group?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${groupId}/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const addPricing = async () => {
    if (!pricingForm.product_id || !pricingForm.price) {
      alert('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/groups/${groupId}/pricing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: parseInt(pricingForm.product_id),
          price: parseFloat(pricingForm.price)
        })
      });

      if (res.ok) {
        fetchData();
        setShowAddPricing(false);
        setPricingForm({ product_id: '', price: '' });
      } else {
        alert('Failed to add pricing');
      }
    } catch (error) {
      console.error('Error adding pricing:', error);
    }
  };

  const deletePricing = async (pricingId: number) => {
    if (!confirm('Remove this pricing rule?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8001/api/v1/admin/customer-groups/pricing/${pricingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete pricing');
      }
    } catch (error) {
      console.error('Error deleting pricing:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">Loading...</div>
      </AdminLayout>
    );
  }

  if (!group) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">Group not found</div>
      </AdminLayout>
    );
  }

  const availableCustomers = allCustomers.filter(
    c => !members.some(m => m.id === c.id)
  );

  return (
    <AdminLayout>
      <div className="p-8">
      <div className="mb-6">
        <Link href="/customer-groups" className="text-blue-600 hover:text-blue-800">
          ← Back to Customer Groups
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600 mt-2">{group.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Created {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
          <Link
            href={`/customer-groups/${groupId}/edit`}
            className="btn-primary"
          >
            Edit Group
          </Link>
        </div>

        {group.metadata_ && Object.keys(group.metadata_).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold text-gray-700 mb-2">Metadata:</h3>
            <pre className="text-sm text-gray-600">{JSON.stringify(group.metadata_, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Members ({members.length})</h2>
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="btn-primary"
          >
            + Add Member
          </button>
        </div>

        {showAddMember && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
            >
              <option value="">Select a customer...</option>
              {availableCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.email} {customer.first_name && `- ${customer.first_name} ${customer.last_name}`}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={addMember}
                className="btn-primary"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddMember(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No members yet</p>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium">{member.email}</div>
                  {member.first_name && (
                    <div className="text-sm text-gray-600">{member.first_name} {member.last_name}</div>
                  )}
                  <div className="text-xs text-gray-500">Joined {new Date(member.created_at).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Special Pricing ({pricing.length})</h2>
          <button
            onClick={() => setShowAddPricing(!showAddPricing)}
            className="btn-primary"
          >
            + Add Pricing Rule
          </button>
        </div>

        {showAddPricing && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                placeholder="Product ID"
                value={pricingForm.product_id}
                onChange={(e) => setPricingForm({ ...pricingForm, product_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Special Price"
                value={pricingForm.price}
                onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addPricing}
                className="btn-primary"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddPricing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {pricing.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No special pricing rules</p>
        ) : (
          <div className="space-y-2">
            {pricing.map(rule => (
              <div key={rule.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium">Product #{rule.product_id}</div>
                  <div className="text-sm text-gray-600">
                    Special Price: ${rule.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Added {new Date(rule.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => deletePricing(rule.id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
