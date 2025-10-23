'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Upload, Camera } from 'lucide-react'

interface Props {
  onClose: () => void
  onSuccess: () => void
  userId: string
}

export default function GoatForm({ onClose, onSuccess, userId }: Props) {
  const [formData, setFormData] = useState({
    tagNumber: '',
    ownerName: '',
    gender: 'Male' as 'Male' | 'Female'
  })
  const [goatPhoto, setGoatPhoto] = useState<File | null>(null)
  const [tagPhoto, setTagPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const uploadPhoto = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('goat-photos')
      .upload(path, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('goat-photos')
      .getPublicUrl(path)
    
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let goatPhotoUrl = ''
      let tagPhotoUrl = ''

      // Upload photos if provided
      if (goatPhoto) {
        const goatPath = `goats/${Date.now()}-${goatPhoto.name}`
        goatPhotoUrl = await uploadPhoto(goatPhoto, goatPath)
      }

      if (tagPhoto) {
        const tagPath = `tags/${Date.now()}-${tagPhoto.name}`
        tagPhotoUrl = await uploadPhoto(tagPhoto, tagPath)
      }

      // Insert goat record
      const { error } = await supabase
        .from('goats')
        .insert({
          tag_number: formData.tagNumber,
          owner_name: formData.ownerName,
          gender: formData.gender,
          goat_photo_url: goatPhotoUrl,
          tag_photo_url: tagPhotoUrl,
          created_by: userId
        })

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-700">Add New Goat</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Number *
              </label>
              <input
                type="text"
                value={formData.tagNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, tagNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'Male' | 'Female' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="Male">Male ♂️</option>
                <option value="Female">Female ♀️</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goat Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGoatPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                  id="goat-photo"
                />
                <label htmlFor="goat-photo" className="cursor-pointer">
                  <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {goatPhoto ? goatPhoto.name : 'Click to upload goat photo'}
                  </p>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTagPhoto(e.target.files?.[0] || null)}
                  className="hidden"
                  id="tag-photo"
                />
                <label htmlFor="tag-photo" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {tagPhoto ? tagPhoto.name : 'Click to upload tag photo'}
                  </p>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? 'Adding...' : 'Add Goat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}