export interface BreedingRecord {
  id: string
  doe_id: string
  buck_id: string
  breeding_date: string
  expected_due_date?: string
  actual_birth_date?: string
  pregnancy_status: 'Bred' | 'Confirmed' | 'Failed' | 'Birthed'
  number_of_kids?: number
  notes?: string
  created_at: string
  created_by: string
  doe?: {
    tag_number: string
    owner_name: string
  }
  buck?: {
    tag_number: string
    owner_name: string
  }
}

export interface Offspring {
  id: string
  breeding_record_id: string
  kid_id?: string
  birth_order: number
  birth_weight?: number
  gender: 'Male' | 'Female'
  status: 'Alive' | 'Deceased' | 'Sold'
  notes?: string
  created_at: string
  kid?: {
    tag_number: string
  }
}

export type BreedingStatus = 'Available' | 'Pregnant' | 'Nursing' | 'Retired'