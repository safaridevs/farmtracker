export interface Notification {
  id: string
  type: 'breeding_due' | 'health_due' | 'vaccination_overdue' | 'checkup_reminder' | 'pregnancy_check'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  goat_id?: string
  health_record_id?: string
  breeding_record_id?: string
  due_date: string
  is_read: boolean
  created_at: string
}

export interface NotificationSummary {
  total: number
  urgent: number
  high: number
  unread: number
}