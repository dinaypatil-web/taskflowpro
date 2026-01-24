'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Mic, Users, Calendar, Sparkles } from 'lucide-react'
import { VoiceTaskCreator } from '@/components/voice/VoiceTaskCreator'

export function QuickActions() {
  const [showVoiceCreator, setShowVoiceCreator] = useState(false)

  const actions = [
    {
      name: 'New Task',
      description: 'Create a new task',
      href: '/tasks/new',
      icon: Plus,
      gradient: 'from-blue-500 to-purple-600',
      hoverGradient: 'hover:from-blue-600 hover:to-purple-700',
    },
    {
      name: 'Voice Task',
      description: 'Create task with voice',
      onClick: () => setShowVoiceCreator(true),
      icon: Mic,
      gradient: 'from-pink-500 to-rose-500',
      hoverGradient: 'hover:from-pink-600 hover:to-rose-600',
    },
    {
      name: 'Add Stakeholder',
      description: 'Add new contact',
      href: '/stakeholders/new',
      icon: Users,
      gradient: 'from-cyan-500 to-blue-500',
      hoverGradient: 'hover:from-cyan-600 hover:to-blue-600',
    },
    {
      name: 'View Calendar',
      description: 'See your schedule',
      href: '/calendar',
      icon: Calendar,
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-600',
    },
  ]

  return (
    <>
      <div className="glass-card animate-fade-in-up">
        <div className="flex items-center space-x-2 mb-6">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold text-gradient-primary">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            action.href ? (
              <Link
                key={action.name}
                href={action.href}
                className={`
                  group relative overflow-hidden bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
                  text-white rounded-2xl p-6 text-center transition-all duration-300 
                  min-h-[120px] flex flex-col justify-center items-center
                  hover:shadow-2xl hover:scale-105 active:scale-95
                  animate-fade-in-up animate-stagger-${Math.min(index + 1, 4)}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <action.icon className="h-8 w-8 mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-sm font-semibold mb-1 relative z-10">{action.name}</h3>
                <p className="text-xs opacity-90 relative z-10">{action.description}</p>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -top-2 -left-2 w-4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            ) : (
              <button
                key={action.name}
                onClick={action.onClick}
                className={`
                  group relative overflow-hidden bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
                  text-white rounded-2xl p-6 text-center transition-all duration-300 
                  min-h-[120px] flex flex-col justify-center items-center
                  hover:shadow-2xl hover:scale-105 active:scale-95
                  animate-fade-in-up animate-stagger-${Math.min(index + 1, 4)}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <action.icon className="h-8 w-8 mb-3 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-sm font-semibold mb-1 relative z-10">{action.name}</h3>
                <p className="text-xs opacity-90 relative z-10">{action.description}</p>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -top-2 -left-2 w-4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            )
          ))}
        </div>
      </div>

      {/* Voice Task Creator Modal */}
      {showVoiceCreator && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowVoiceCreator(false)} />
            
            <div className="inline-block align-bottom glass-card text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slide-up">
              <div className="p-6">
                <VoiceTaskCreator
                  onTaskCreated={() => {
                    setShowVoiceCreator(false)
                    // Optionally refresh dashboard data
                  }}
                  onClose={() => setShowVoiceCreator(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}