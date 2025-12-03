'use client'

import { useState } from 'react'
import { Calendar, Activity, TrendingUp, Baby, Heart, AlertCircle } from 'lucide-react'

interface Props {
  goats: any[]
}

export default function EnhancedBreedingDashboard({ goats }: Props) {
  const [activeSection, setActiveSection] = useState<'heat' | 'pregnancy' | 'performance' | 'kidding'>('heat')

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveSection('heat')}
            className={`p-4 rounded-lg transition ${
              activeSection === 'heat'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart className="mx-auto mb-2" size={20} />
            <p className="text-sm font-medium">Heat Cycles</p>
          </button>
          
          <button
            onClick={() => setActiveSection('pregnancy')}
            className={`p-4 rounded-lg transition ${
              activeSection === 'pregnancy'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="mx-auto mb-2" size={20} />
            <p className="text-sm font-medium">Pregnancy</p>
          </button>
          
          <button
            onClick={() => setActiveSection('kidding')}
            className={`p-4 rounded-lg transition ${
              activeSection === 'kidding'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Baby className="mx-auto mb-2" size={20} />
            <p className="text-sm font-medium">Kidding</p>
          </button>
          
          <button
            onClick={() => setActiveSection('performance')}
            className={`p-4 rounded-lg transition ${
              activeSection === 'performance'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="mx-auto mb-2" size={20} />
            <p className="text-sm font-medium">Performance</p>
          </button>
        </div>
      </div>

      {/* Heat Cycle Tracking */}
      {activeSection === 'heat' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="text-pink-600" size={24} />
            <h3 className="text-xl font-bold">Heat Cycle Tracking</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h4 className="font-semibold text-pink-800 mb-2">📅 Upcoming Heat Cycles</h4>
              <p className="text-sm text-pink-700">Track and predict doe heat cycles for optimal breeding timing</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Average Cycle: 21 days</span>
                  <span className="text-gray-700">Optimal Breeding: Day 1-2</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-800 mb-2">Record Heat Cycle</h5>
                <div className="space-y-3">
                  <select className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>Select Doe...</option>
                    {goats.filter(g => g.gender === 'Female').map(doe => (
                      <option key={doe.id} value={doe.id}>{doe.tag_number}</option>
                    ))}
                  </select>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <select className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>Intensity</option>
                    <option value="weak">Weak</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                  </select>
                  <button className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 text-sm">
                    Record Heat Cycle
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-800 mb-2">Heat Predictions</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Expected:</span>
                    <span className="font-medium">In 5 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breeding Window:</span>
                    <span className="font-medium">Dec 25-27</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cycle Regularity:</span>
                    <span className="font-medium text-green-600">Regular</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pregnancy Monitoring */}
      {activeSection === 'pregnancy' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold">Pregnancy Monitoring</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🔬 Pregnancy Checks</h4>
              <p className="text-sm text-blue-700">Monitor pregnancy progress with regular checkups</p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded">
                  <p className="text-gray-600">Day 30</p>
                  <p className="font-medium">Palpation</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <p className="text-gray-600">Day 60</p>
                  <p className="font-medium">Ultrasound</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <p className="text-gray-600">Day 120</p>
                  <p className="font-medium">Final Check</p>
                </div>
                <div className="bg-white p-2 rounded">
                  <p className="text-gray-600">Day 150</p>
                  <p className="font-medium">Due Date</p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-800 mb-3">Record Pregnancy Check</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Select Breeding Record...</option>
                </select>
                <input type="date" className="px-3 py-2 border rounded-lg text-sm" placeholder="Check Date" />
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Check Type</option>
                  <option value="visual">Visual</option>
                  <option value="palpation">Palpation</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="blood_test">Blood Test</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Pregnancy Status</option>
                  <option value="true">Confirmed</option>
                  <option value="false">Not Pregnant</option>
                </select>
                <input type="number" className="px-3 py-2 border rounded-lg text-sm" placeholder="Estimated Kids" />
                <input type="date" className="px-3 py-2 border rounded-lg text-sm" placeholder="Next Check Date" />
              </div>
              <textarea className="w-full mt-3 px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Notes..."></textarea>
              <button className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Save Pregnancy Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kidding Records */}
      {activeSection === 'kidding' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="text-green-600" size={24} />
            <h3 className="text-xl font-bold">Kidding Records</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">👶 Birth Details</h4>
              <p className="text-sm text-green-700">Comprehensive kidding records for each birth</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-800 mb-3">Record Kidding</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Select Breeding Record...</option>
                </select>
                <input type="datetime-local" className="px-3 py-2 border rounded-lg text-sm" />
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Kidding Type</option>
                  <option value="natural">Natural</option>
                  <option value="assisted">Assisted</option>
                  <option value="cesarean">Cesarean</option>
                </select>
                <input type="number" className="px-3 py-2 border rounded-lg text-sm" placeholder="Labor Duration (min)" />
                <input type="number" className="px-3 py-2 border rounded-lg text-sm" placeholder="Total Kids Born" />
                <input type="number" className="px-3 py-2 border rounded-lg text-sm" placeholder="Kids Alive" />
                <input type="number" className="px-3 py-2 border rounded-lg text-sm" placeholder="Stillborn" />
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Dam Condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <textarea className="w-full mt-3 px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Complications or notes..."></textarea>
              <button className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm">
                Save Kidding Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breeding Performance */}
      {activeSection === 'performance' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-purple-600" size={24} />
            <h3 className="text-xl font-bold">Breeding Performance</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">Conception Rate</p>
              <p className="text-3xl font-bold text-purple-800">85%</p>
              <p className="text-xs text-purple-600 mt-1">↑ 5% from last season</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Avg Litter Size</p>
              <p className="text-3xl font-bold text-blue-800">2.3</p>
              <p className="text-xs text-blue-600 mt-1">Kids per birth</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Total Offspring</p>
              <p className="text-3xl font-bold text-green-800">47</p>
              <p className="text-xs text-green-600 mt-1">This year</p>
            </div>
          </div>
          
          <div className="mt-6 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Top Performers</h5>
            <div className="space-y-2">
              {goats.slice(0, 5).map((goat, idx) => (
                <div key={goat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                    <span className="font-medium">{goat.tag_number}</span>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-purple-600">95% Success</p>
                    <p className="text-gray-500">12 offspring</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}