'use client'

import { CheckSquare, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface TaskStatsProps {
  stats?: Record<string, number>
  isLoading: boolean
}

export function TaskStats({ stats, isLoading }: TaskStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl loading-skeleton" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded loading-skeleton mb-2" />
                <div className="h-6 bg-gray-200 rounded loading-skeleton w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const totalTasks = Object.values(stats || {}).reduce((sum, count) => sum + count, 0)
  const completedTasks = stats?.COMPLETED || 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const statCards = [
    {
      name: 'Total Tasks',
      value: totalTasks,
      icon: CheckSquare,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Pending',
      value: stats?.PENDING || 0,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
      change: '-5%',
      changeType: 'positive',
    },
    {
      name: 'In Progress',
      value: stats?.IN_PROGRESS || 0,
      icon: AlertCircle,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Completed',
      value: completedTasks,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      change: `${completionRate}%`,
      changeType: 'rate',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-bold text-gradient-primary">Task Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={stat.name} 
            className={`glass-card hover-lift group animate-fade-in-up animate-stagger-${Math.min(index + 1, 4)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-6 w-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} />
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                stat.changeType === 'positive' 
                  ? 'bg-green-100 text-green-700' 
                  : stat.changeType === 'rate'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
              <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </div>

            {/* Animated progress bar for completed tasks */}
            {stat.name === 'Completed' && totalTasks > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion Rate</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000 ease-out`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}