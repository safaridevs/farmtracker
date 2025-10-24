export interface Goat {
  id: string
  tag_number: string
  owner_name: string
  gender: 'Male' | 'Female'
  goat_photo_url?: string
  tag_photo_url?: string
  birth_date?: string
  weight?: number
  health_status?: 'Healthy' | 'Sick' | 'Under Treatment' | 'Quarantine'
  breeding_status?: 'Available' | 'Pregnant' | 'Nursing' | 'Retired'
  sire_id?: string
  dam_id?: string
  notes?: string
  created_at: string
  created_by: string
}