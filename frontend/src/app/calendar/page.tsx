'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { tasksApi } from '@/lib/api/tasks'
import { calendarApi } from '@/lib/api/calendar'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthProtectedPage } from '@/components/ClientOnly'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { formatStatus, formatDate, getPriorityColor, getStatusColor } from '@/lib/utils'

export default function CalendarPage() {
  return (
    <AuthProtectedPage>
      <CalendarPageContent />
    </AuthProtectedPage>
  )
}

function CalendarPageContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const { data: monthData, isLoading } = useQuery(
    ['calendar-month', currentDate.getMonth() + 1, currentDate.getFullYear()],
    () => {
      return calendarApi.getMonthView(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
    },
    { enabled: isAuthenticated }
  )

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    if (!monthData?.events) return []

    const dateKey = date.toISOString().split('T')[0]
    return monthData.events[dateKey] || []
  }

  const isTaskDelayed = (task: any) => {
    if (task.status === 'COMPLETED') return false
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = getDaysInMonth(currentDate)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm sm:text-base text-gray-600">View and manage your tasks by date</p>
          </div>
          <Link
            href="/tasks/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center justify-center sm:justify-start space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden w-full sm:w-auto">
                {(['month', 'week', 'day'] as const).map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`flex-1 sm:flex-none px-3 py-2 text-sm capitalize ${view === viewType
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {viewType}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-3 bg-gray-50"></div>
                }

                const dayEvents = getEventsForDate(day)
                const isToday =
                  day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear()

                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 sm:p-3 min-h-[80px] sm:min-h-[120px] border border-gray-200 bg-white hover:bg-gray-50 ${isToday ? 'ring-2 ring-primary-500' : ''
                      }`}
                  >
                    <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isToday ? 'text-primary-600' : 'text-gray-900'
                      }`}>
                      {day.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event: any) => {
                        const taskPayload = event.task || event
                        const delayed = isTaskDelayed(taskPayload)
                        const id = event.taskId || event.id
                        return (
                          <Link
                            key={event.id}
                            href={`/tasks/${id}`}
                            className={`block p-1 rounded text-[10px] sm:text-xs truncate transition-all border ${delayed
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : `${getPriorityColor(taskPayload.priority)} border-transparent hover:opacity-80`
                              }`}
                          >
                            <div className="flex items-center">
                              {delayed && <AlertCircle className="h-2 w-2 mr-1 flex-shrink-0" />}
                              <span className="truncate">{event.title}</span>
                            </div>
                          </Link>
                        )
                      })}

                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-gray-500 text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : Object.values(monthData?.events || {}).flat().length > 0 ? (
              <div className="space-y-4">
                {Object.values(monthData?.events || {}).flat().slice(0, 5).map((event: any) => {
                  const taskPayload = event.task || event
                  const id = event.taskId || event.id
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </h4>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(taskPayload.status)}`}>
                            {formatStatus(taskPayload.status)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(taskPayload.priority)}`}>
                            {taskPayload.priority}
                          </span>
                          {isTaskDelayed(taskPayload) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Delayed
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          {event.startDate && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Due {formatDate(event.startDate)}
                            </div>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/tasks/${id}`}
                        className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming tasks</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a task with a due date to see it here.
                </p>
                <div className="mt-6">
                  <Link
                    href="/tasks/new"
                    className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}