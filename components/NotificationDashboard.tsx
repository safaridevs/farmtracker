'use client'

import { useState, useEffect } from 'react'
import { Goat } from '@/types/goat'
import { HealthRecord } from '@/types/health'
import { BreedingRecord } from '@/types/breeding'
import { AlertTriangle, Calendar, CheckCircle, Clock, Baby, Heart } from 'lucide-react'

interface Props {
  goats: Goat[]
  healthRecords: HealthRecord[]
  breedingRecords: BreedingRecord[]
}

interface Alert {
  id: string
  type: 'urgent' | 'warning' | 'info'
  category: 'breeding' | 'health' | 'general'
  title: string
  message: string
  dueDate: string
  goatTag?: string
  actionNeeded: string
}

export default function NotificationDashboard({ goats, healthRecords, breedingRecords }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    generateAlerts()
  }, [goats, healthRecords, breedingRecords])

  const generateAlerts = () => {
    const newAlerts: Alert[] = []
    const today = new Date()

    // Breeding alerts
    breedingRecords.forEach(record => {
      if (record.pregnancy_status === 'Confirmed' && record.expected_due_date) {
        const dueDate = new Date(record.expected_due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDue <= 0) {
          newAlerts.push({
            id: `birth-overdue-${record.id}`,
            type: 'urgent',
            category: 'breeding',
            title: 'Birth Overdue',
            message: `${record.doe?.tag_number} was expected to give birth ${Math.abs(daysUntilDue)} days ago`,
            dueDate: record.expected_due_date,
            goatTag: record.doe?.tag_number,
            actionNeeded: 'Check goat immediately and consider veterinary assistance'
          })
        } else if (daysUntilDue <= 3) {
          newAlerts.push({
            id: `birth-soon-${record.id}`,
            type: 'warning',
            category: 'breeding',
            title: 'Birth Due Soon',
            message: `${record.doe?.tag_number} is due to give birth in ${daysUntilDue} days`,
            dueDate: record.expected_due_date,
            goatTag: record.doe?.tag_number,
            actionNeeded: 'Prepare birthing area and monitor closely'
          })
        } else if (daysUntilDue <= 7) {
          newAlerts.push({
            id: `birth-week-${record.id}`,
            type: 'info',
            category: 'breeding',
            title: 'Birth Due This Week',
            message: `${record.doe?.tag_number} is due in ${daysUntilDue} days`,
            dueDate: record.expected_due_date,
            goatTag: record.doe?.tag_number,
            actionNeeded: 'Monitor daily and prepare for birth'
          })
        }
      }

      // Pregnancy confirmation needed
      if (record.pregnancy_status === 'Bred') {
        const breedingDate = new Date(record.breeding_date)
        const daysSinceBred = Math.ceil((today.getTime() - breedingDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceBred >= 30) {
          newAlerts.push({
            id: `pregnancy-check-${record.id}`,
            type: 'warning',
            category: 'breeding',
            title: 'Pregnancy Check Needed',
            message: `${record.doe?.tag_number} was bred ${daysSinceBred} days ago`,
            dueDate: new Date(breedingDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            goatTag: record.doe?.tag_number,
            actionNeeded: 'Confirm pregnancy status'
          })
        }
      }
    })

    // Health alerts
    healthRecords.forEach(record => {
      if (record.next_due_date) {
        const dueDate = new Date(record.next_due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const goat = goats.find(g => g.id === record.goat_id)
        
        if (daysUntilDue <= 0) {
          newAlerts.push({
            id: `health-overdue-${record.id}`,
            type: 'urgent',
            category: 'health',
            title: `${record.record_type} Overdue`,
            message: `${goat?.tag_number} - ${record.title} was due ${Math.abs(daysUntilDue)} days ago`,
            dueDate: record.next_due_date,
            goatTag: goat?.tag_number,
            actionNeeded: `Schedule ${record.record_type.toLowerCase()} immediately`
          })
        } else if (daysUntilDue <= 7) {
          newAlerts.push({
            id: `health-due-${record.id}`,
            type: 'warning',
            category: 'health',
            title: `${record.record_type} Due Soon`,
            message: `${goat?.tag_number} - ${record.title} due in ${daysUntilDue} days`,
            dueDate: record.next_due_date,
            goatTag: goat?.tag_number,
            actionNeeded: `Schedule ${record.record_type.toLowerCase()}`
          })
        }
      }
    })

    // Sort by urgency and date
    newAlerts.sort((a, b) => {
      const urgencyOrder = { urgent: 3, warning: 2, info: 1 }
      if (urgencyOrder[a.type] !== urgencyOrder[b.type]) {
        return urgencyOrder[b.type] - urgencyOrder[a.type]
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    setAlerts(newAlerts)
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-orange-500 bg-orange-50'
      case 'info':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getAlertIcon = (type: string, category: string) => {
    if (type === 'urgent') return <AlertTriangle className="h-5 w-5 text-red-600" />
    if (category === 'breeding') return <Baby className="h-5 w-5 text-pink-600" />
    if (category === 'health') return <Heart className="h-5 w-5 text-green-600" />
    return <Clock className="h-5 w-5 text-blue-600" />
  }

  const urgentCount = alerts.filter(a => a.type === 'urgent').length
  const warningCount = alerts.filter(a => a.type === 'warning').length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Urgent Actions</p>
              <p className="text-2xl font-semibold text-gray-900">{urgentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Due Soon</p>
              <p className="text-2xl font-semibold text-gray-900">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Notifications</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {alerts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">No urgent notifications at this time.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`px-6 py-4 border-l-4 ${getAlertStyle(alert.type)}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getAlertIcon(alert.type, alert.category)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(alert.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Action: {alert.actionNeeded}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}