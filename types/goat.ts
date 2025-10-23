export interface Goat {
  id: string
  tag_number: string
  owner_name: string
  gender: 'Male' | 'Female'
  goat_photo_url?: string
  tag_photo_url?: string
  created_at: string
  created_by: string
}