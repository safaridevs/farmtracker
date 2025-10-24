export interface HealthRecord {
  id: string
  goat_id: string
  record_type: 'Vaccination' | 'Treatment' | 'Checkup' | 'Weight' | 'Other'
  title: string
  description?: string
  date: string
  next_due_date?: string
  cost?: number
  veterinarian?: string
  created_at: string
  created_by: string
}

export type HealthStatus = 'Healthy' | 'Sick' | 'Under Treatment' | 'Quarantine'