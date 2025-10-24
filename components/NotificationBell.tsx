'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Notification, NotificationSummary } from '@/types/notification'
import { Goat } from '@/types/goat'
import { HealthRecord } from '@/types/health'
import { BreedingRecord } from '@/types/breeding'
import { Bell, AlertTriangle, Calendar, Heart, Baby, X } from 'lucide-react'

interface Props {
  goats: Goat[]
  healthRecords: HealthRecord[]
  breedingRecords: BreedingRecord[]
}

export default function NotificationBell({ goats, healthRecords, breedingRecords }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [summary, setSummary] = useState<NotificationSummary>({
    total: 0,
    urgent: 0,
    high: 0,
    unread: 0
  })

  const supabase = createClient()

  useEffect(() => {
    generateNotifications()
  }, [goats, healthRecords, breedingRecords])

  const generateNotifications = () => {
    const alerts: Notification[] = []
    const today = new Date()
    const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Breeding due dates
    breedingRecords
      .filter(r => r.pregnancy_status === 'Confirmed' && r.expected_due_date)
      .forEach(record => {
        const dueDate = new Date(record.expected_due_date!)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDue <= 0) {
          alerts.push({
            id: `breeding-overdue-${record.id}`,
            type: 'breeding_due',
            priority: 'urgent',
            title: 'Birth Overdue!',
            message: `${record.doe?.tag_number} was due ${Math.abs(daysUntilDue)} days ago`,
            breeding_record_id: record.id,
            due_date: record.expected_due_date!,
            is_read: false,
            created_at: new Date().toISOString()
          })
        } else if (daysUntilDue <= 3) {
          alerts.push({
            id: `breeding-due-${record.id}`,
            type: 'breeding_due',
            priority: 'high',
            title: 'Birth Due Soon',
            message: `${record.doe?.tag_number} due in ${daysUntilDue} days`,
            breeding_record_id: record.id,
            due_date: record.expected_due_date!,
            is_read: false,
            created_at: new Date().toISOString()
          })
        } else if (daysUntilDue <= 7) {
          alerts.push({
            id: `breeding-week-${record.id}`,
            type: 'breeding_due',
            priority: 'medium',
            title: 'Birth Due This Week',
            message: `${record.doe?.tag_number} due in ${daysUntilDue} days`,
            breeding_record_id: record.id,
            due_date: record.expected_due_date!,
            is_read: false,
            created_at: new Date().toISOString()
          })
        }
      })

    // Health record due dates
    healthRecords
      .filter(r => r.next_due_date)
      .forEach(record => {
        const dueDate = new Date(record.next_due_date!)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 1000))
        const goat = goats.find(g => g.id === record.goat_id)
        
        if (daysUntilDue <= 0) {
          alerts.push({
            id: `health-overdue-${record.id}`,
            type: 'health_due',
            priority: 'urgent',
            title: `${record.record_type} Overdue!`,
            message: `${goat?.tag_number} - ${record.title} was due ${Math.abs(daysUntilDue)} days ago`,
            goat_id: record.goat_id,
            health_record_id: record.id,
            due_date: record.next_due_date!,
            is_read: false,
            created_at: new Date().toISOString()
          })
        } else if (daysUntilDue <= 7) {
          alerts.push({
            id: `health-due-${record.id}`,
            type: 'health_due',
            priority: 'high',
            title: `${record.record_type} Due Soon`,
            message: `${goat?.tag_number} - ${record.title} due in ${daysUntilDue} days`,
            goat_id: record.goat_id,
            health_record_id: record.id,
            due_date: record.next_due_date!,
            is_read: false,
            created_at: new Date().toISOString()
          })
        }
      })

    // Pregnancy check reminders (30 days after breeding)
    breedingRecords
      .filter(r => r.pregnancy_status === 'Bred')
      .forEach(record => {
        const breedingDate = new Date(record.breeding_date)
        const checkDate = new Date(breedingDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        const daysUntilCheck = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 1000))
        
        if (daysUntilCheck <= 0) {
          alerts.push({
            id: `pregnancy-check-${record.id}`,
            type: 'pregnancy_check',
            priority: 'high',
            title: 'Pregnancy Check Due',
            message: `${record.doe?.tag_number} - Confirm pregnancy (bred ${Math.abs(daysUntilCheck + 30)} days ago)`,
            breeding_record_id: record.id,
            due_date: checkDate.toISOString().split('T')[0],
            is_read: false,
            created_at: new Date().toISOString()
          })
        }
      })

    // Sort by priority and due date
    alerts.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })

    setNotifications(alerts)
    setSummary({
      total: alerts.length,
      urgent: alerts.filter(a => a.priority === 'urgent').length,
      high: alerts.filter(a => a.priority === 'high').length,
      unread: alerts.length // All are unread for now
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breeding_due': return <Baby size={16} />
      case 'pregnancy_check': return <Baby size={16} />
      case 'health_due': return <Heart size={16} />
      default: return <Calendar size={16} />
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition"
      >
        <Bell size={24} />
        {summary.total > 0 && (
          <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center ${
            summary.urgent > 0 ? 'bg-red-500' : summary.high > 0 ? 'bg-orange-500' : 'bg-blue-500'
          }`}>
            {summary.total > 9 ? '9+' : summary.total}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            {summary.total > 0 && (
              <div className="flex gap-2 mt-2 text-xs">
                {summary.urgent > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {summary.urgent} Urgent
                  </span>
                )}
                {summary.high > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {summary.high} High
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No notifications</p>
                <p className="text-xs">All caught up! 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          Due: {new Date(notification.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}