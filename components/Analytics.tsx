'use client'

import { Goat } from '@/types/goat'
import { HealthRecord } from '@/types/health'
import { BarChart3, PieChart, TrendingUp, Heart, Calendar, DollarSign, Baby } from 'lucide-react'

interface Props {
  goats: Goat[]
  healthRecords: HealthRecord[]
}

export default function Analytics({ goats, healthRecords }: Props) {
  const totalGoats = goats.length
  const maleCount = goats.filter(g => g.gender === 'Male').length
  const femaleCount = goats.filter(g => g.gender === 'Female').length
  
  const healthyCount = goats.filter(g => g.health_status === 'Healthy' || !g.health_status).length
  const sickCount = goats.filter(g => g.health_status === 'Sick').length
  const treatmentCount = goats.filter(g => g.health_status === 'Under Treatment').length
  
  const pregnantCount = goats.filter(g => g.breeding_status === 'Pregnant').length
  const nursingCount = goats.filter(g => g.breeding_status === 'Nursing').length
  const availableForBreeding = goats.filter(g => g.breeding_status === 'Available' || !g.breeding_status).length
  
  const totalHealthCosts = healthRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
  const recentRecords = healthRecords.filter(r => 
    new Date(r.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length

  const avgWeight = goats.filter(g => g.weight).reduce((sum, g) => sum + (g.weight || 0), 0) / goats.filter(g => g.weight).length || 0

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Farm Analytics</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          icon={PieChart}
          title="Total Goats"
          value={totalGoats}
          subtitle={`${maleCount} Male, ${femaleCount} Female`}
          color="#10B981"
        />
        
        <StatCard
          icon={Heart}
          title="Health Status"
          value={`${healthyCount}/${totalGoats}`}
          subtitle={sickCount > 0 ? `${sickCount} need attention` : 'All healthy'}
          color={sickCount > 0 ? "#EF4444" : "#10B981"}
        />
        
        <StatCard
          icon={TrendingUp}
          title="Avg Weight"
          value={avgWeight > 0 ? `${avgWeight.toFixed(1)} lbs` : 'N/A'}
          subtitle={`${goats.filter(g => g.weight).length} recorded`}
          color="#8B5CF6"
        />
        
        <StatCard
          icon={Baby}
          title="Breeding Status"
          value={`${pregnantCount + nursingCount}/${totalGoats}`}
          subtitle={`${pregnantCount} pregnant, ${nursingCount} nursing`}
          color="#EC4899"
        />
        
        <StatCard
          icon={DollarSign}
          title="Health Costs"
          value={`$${totalHealthCosts.toFixed(2)}`}
          subtitle={`${recentRecords} records this month`}
          color="#F59E0B"
        />
      </div>

      {/* Gender Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Gender Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-medium">♂️ Male</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${totalGoats > 0 ? (maleCount / totalGoats) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-12">{maleCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pink-600 font-medium">♀️ Female</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pink-600 h-2 rounded-full" 
                    style={{ width: `${totalGoats > 0 ? (femaleCount / totalGoats) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-12">{femaleCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Health Overview
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-medium">Healthy</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${totalGoats > 0 ? (healthyCount / totalGoats) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-12">{healthyCount}</span>
              </div>
            </div>
            {sickCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-red-600 font-medium">Sick</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${totalGoats > 0 ? (sickCount / totalGoats) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12">{sickCount}</span>
                </div>
              </div>
            )}
            {treatmentCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-yellow-600 font-medium">Treatment</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${totalGoats > 0 ? (treatmentCount / totalGoats) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12">{treatmentCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}