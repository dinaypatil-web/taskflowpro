'use client'

import Link from 'next/link'
import { formatRelativeTime, getPriorityColor, getStatusColor } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Task } from '@/types/task'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'

interface RecentTasksProps {
  tasks: Task[]
  isLoading: boolean
}

export function RecentTasks({ tasks, isLoading }: RecentTasksProps) {
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-xl font-bold text-gradient-primary">Recent Tasks</h3>
        </div>
        <Link
          href="/tasks"
          className="group flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
      
      <div>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/50 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded loading-skeleton mb-2" />
                    <div className="flex space-x-2">
                      <div className="h-3 bg-gray-200 rounded loading-skeleton w-16" />
                      <div className="h-3 bg-gray-200 rounded loading-skeleton w-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No tasks yet</p>
            <p className="text-sm text-gray-500 mb-4">Create your first task to get started</p>
            <Link
              href="/tasks"
              className="btn-primary btn-sm"
            >
              Create Task
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`group p-4 rounded-xl bg-white/50 hover:bg-white/80 border border-white/20 hover:border-white/40 transition-all duration-300 hover-lift animate-fade-in-up animate-stagger-${Math.min(index + 1, 4)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-2 group-hover:text-blue-700 transition-colors duration-200">
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Updated {formatRelativeTime(task.updatedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="ml-4 p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 group-hover:scale-110"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}