'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

export default function CategoriesPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: ''
  })

  useEffect(() => {
    checkAuthAndLoadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  const checkAuthAndLoadCategories = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { locale_code: language }
      })
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
      localStorage.removeItem('admin_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '', image_url: '' })
    setShowModal(true)
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (categoryId: number) => {
    if (!confirm(t.categories.deleteConfirm)) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/admin/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await checkAuthAndLoadCategories()
      alert(t.messages.deleteSuccess)
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(t.messages.deleteError)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.slug.trim()) {
      alert(t.categories.nameRequired)
      return
    }

    try {
      const token = localStorage.getItem('admin_token')

      if (editingCategory) {
        await axios.put(
          `${API_URL}/admin/categories/${editingCategory.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        alert(t.messages.saveSuccess)
      } else {
        await axios.post(
          `${API_URL}/admin/categories`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        alert(t.messages.saveSuccess)
      }

      setShowModal(false)
      setFormData({ name: '', slug: '', description: '', image_url: '' })
      await checkAuthAndLoadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert(t.messages.saveError)
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
          <div>
            <h1 className="text-2xl font-semibold text-ui-fg-base">{t.categories.title}</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">{t.categories.subtitle} ({categories.length})</p>
          </div>
          <button onClick={handleAddNew} className="btn-primary">
            {t.categories.addCategory}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card p-6">
              {category.image_url && (
                <img 
                  src={category.image_url} 
                  alt={category.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-ui-fg-base mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-ui-fg-muted mb-4">
                {category.description || t.categories.noDescription}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-ui-fg-muted">
                  {t.categories.slug}: {category.slug}
                </span>
                <div className="space-x-2">
                  <button onClick={() => handleEdit(category)} className="btn-ghost txt-compact-small">{t.common.edit}</button>
                  <button onClick={() => handleDelete(category.id)} className="btn-ghost txt-compact-small text-red-600">{t.common.delete}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="card p-8 text-center text-ui-fg-muted">
            {t.categories.noCategories}
          </div>
        )}

        {/* Add/Edit Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? t.categories.editCategory : t.categories.addCategory}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.categories.name} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.categories.slug} *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.categories.description}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.categories.imageUrl}</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
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
                    {editingCategory ? t.common.update : t.common.create}
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
