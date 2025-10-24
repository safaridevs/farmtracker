'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Goat } from '@/types/goat'
import { HealthRecord } from '@/types/health'
import { Trash2, Eye, Calendar, Edit, Heart, Activity, Baby } from 'lucide-react'
import Image from 'next/image'
import HealthCard from './HealthCard'

interface Props {
  goat: Goat
  onUpdate: () => void
  onEdit: (goat: Goat) => void
  onBreeding: (goat: Goat) => void
  healthRecords: HealthRecord[]
}

export default function GoatCard({ goat, onUpdate, onEdit, onBreeding, healthRecords }: Props) {
  const [showImageModal, setShowImageModal] = useState<string | null>(null)
  const [showHealthCard, setShowHealthCard] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete goat ${goat.tag_number}?`)) return
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('goats')
        .delete()
        .eq('id', goat.id)
      
      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting goat:', error)
      alert('Failed to delete goat')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-green-100 hover:shadow-xl transition duration-300 overflow-hidden">
        <div className="p-6">
          {/* Photos */}
          <div className="flex gap-4 mb-4">
            {goat.goat_photo_url && (
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 border-green-300 cursor-pointer hover:opacity-80 transition"
                onClick={() => setShowImageModal(goat.goat_photo_url!)}
              >
                <Image
                  src={goat.goat_photo_url}
                  alt={`Goat ${goat.tag_number}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {goat.tag_photo_url && (
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 cursor-pointer hover:opacity-80 transition"
                onClick={() => setShowImageModal(goat.tag_photo_url!)}
              >
                <Image
                  src={goat.tag_photo_url}
                  alt={`Tag ${goat.tag_number}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-green-700">
              Tag: {goat.tag_number}
            </h3>
            
            <p className="text-gray-700">
              <span className="font-semibold">Owner:</span> {goat.owner_name}
            </p>
            
            <p className="text-gray-600">
              <span className="font-semibold">Gender:</span>
              <span className={goat.gender === 'Female' ? 'text-pink-600' : 'text-blue-600'}>
                {' '}{goat.gender} {goat.gender === 'Female' ? '♀️' : '♂️'}
              </span>
            </p>
            
            {goat.health_status && (
              <p className="text-gray-600">
                <span className="font-semibold">Health:</span>
                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                  goat.health_status === 'Healthy' ? 'bg-green-100 text-green-800' :
                  goat.health_status === 'Sick' ? 'bg-red-100 text-red-800' :
                  goat.health_status === 'Under Treatment' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {goat.health_status}
                </span>
              </p>
            )}
            
            {goat.weight && (
              <p className="text-gray-600">
                <span className="font-semibold">Weight:</span> {goat.weight} lbs
              </p>
            )}
            
            {goat.breeding_status && goat.breeding_status !== 'Available' && (
              <p className="text-gray-600">
                <span className="font-semibold">Breeding:</span>
                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                  goat.breeding_status === 'Pregnant' ? 'bg-pink-100 text-pink-800' :
                  goat.breeding_status === 'Nursing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {goat.breeding_status}
                </span>
              </p>
            )}
            
            <div className="flex items-center text-xs text-gray-400 mt-3">
              <Calendar size={12} className="mr-1" />
              Added: {formatDate(goat.created_at)}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 flex-wrap">
            <button
              onClick={() => setShowHealthCard(true)}
              className="text-green-600 hover:text-green-800 text-sm font-medium transition flex items-center gap-1"
            >
              <Activity size={14} />
              Health ({healthRecords.length})
            </button>
            <button
              onClick={() => onBreeding(goat)}
              className="text-pink-600 hover:text-pink-800 text-sm font-medium transition flex items-center gap-1"
            >
              <Baby size={14} />
              Breeding
            </button>
            <button
              onClick={() => onEdit(goat)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition flex items-center gap-1"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-800 text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowImageModal(null)}
        >
          <div className="max-w-4xl max-h-full">
            <Image
              src={showImageModal}
              alt="Enlarged view"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      
      {/* Health Card Modal */}
      {showHealthCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Health Records - {goat.tag_number}</h3>
              <button
                onClick={() => setShowHealthCard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <HealthCard 
                goatId={goat.id} 
                records={healthRecords} 
                onUpdate={onUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}