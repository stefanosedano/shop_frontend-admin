'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

export default function CollectionsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  })

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      // Mock data for now
      setCollections([
        { id: 1, name: 'Summer Collection', products_count: 45, status: 'active' },
        { id: 2, name: 'Winter Sale', products_count: 32, status: 'active' },
        { id: 3, name: 'New Arrivals', products_count: 28, status: 'active' },
      ])
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCollection(null)
    setFormData({ name: '', description: '', status: 'active' })
    setShowModal(true)
  }

  const handleEdit = (collection: any) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      description: collection.description || '',
      status: collection.status
    })
    setShowModal(true)
  }

  const handleDelete = async (collectionId: number) => {
    if (!confirm('Are you sure you want to delete this collection?')) return

    try {
      const token = localStorage.getItem('admin_token')
      // Mock delete for now
      setCollections(collections.filter(c => c.id !== collectionId))
      alert('Collection deleted successfully')
    } catch (error) {
      console.error('Error deleting collection:', error)
      alert('Failed to delete collection')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Collection name is required')
      return
    }

    try {
      const token = localStorage.getItem('admin_token')

      if (editingCollection) {
        // Mock update
        setCollections(collections.map(c => 
          c.id === editingCollection.id 
            ? { ...c, ...formData }
            : c
        ))
        alert('Collection updated successfully')
      } else {
        // Mock create
        const newCollection = {
          id: Date.now(),
          ...formData,
          products_count: 0
        }
        setCollections([...collections, newCollection])
        alert('Collection created successfully')
      }

      setShowModal(false)
      setFormData({ name: '', description: '', status: 'active' })
    } catch (error) {
      console.error('Error saving collection:', error)
      alert('Failed to save collection')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-bg-interactive"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium text-gray-900">{t.collections.title}</h1>
          <button onClick={handleCreate} className="btn-primary">
            + {t.collections.addCollection}
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.collections.name}</th>
                  <th>{t.collections.products}</th>
                  <th>{t.collections.status}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => (
                  <tr key={collection.id}>
                    <td className="font-medium">{collection.name}</td>
                    <td className="text-ui-fg-muted">{collection.products_count} products</td>
                    <td>
                      <span className="badge badge-success">{collection.status}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(collection)} className="btn-ghost txt-compact-small">{t.common.edit}</button>
                        <button onClick={() => handleDelete(collection.id)} className="btn-ghost txt-compact-small text-red-600">{t.common.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Collection Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingCollection ? t.collections.editCollection : t.collections.createCollection}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.collections.name} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.collections.description}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.collections.status}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input w-full"
                  >
                    <option value="active">{t.common.active}</option>
                    <option value="inactive">{t.common.inactive}</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    {t.common.cancel}
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCollection ? t.common.update : t.common.create}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
