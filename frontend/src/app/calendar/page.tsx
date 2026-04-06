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
import toast from 'react-hot-toast'
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
import { formatStatus, formatDate, getPriorityColor, getStatusColor, isValidDate, toLocalDateString } from '@/lib/utils'
import { GanttChart } from './components/GanttChart'

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
  const [view, setView] = useState<'month' | 'week' | 'day' | 'gantt'>('month')
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false)

  const { data: monthData, isLoading, refetch } = useQuery(
    ['calendar-month', currentDate.getMonth() + 1, currentDate.getFullYear()],
    () => {
      return calendarApi.getMonthView(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
    },
    { enabled: isAuthenticated }
  )

  // Global upcoming tasks query
  const { data: upcomingData, isLoading: isUpcomingLoading } = useQuery(
    ['calendar-upcoming'],
    () => {
      const start = new Date()
      const end = new Date()
      end.setDate(start.getDate() + 30) // Next 30 days
      return calendarApi.getEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      })
    },
    { enabled: isAuthenticated }
  )

  const handleQuickAdd = async (date: Date) => {
    if (!quickAddTitle.trim()) {
      setQuickAddDate(null)
      return
    }

    setIsSubmittingQuickAdd(true)
    try {
      await tasksApi.createTask({
        title: quickAddTitle,
        dueDate: new Date(date).toISOString(),
        priority: 'MEDIUM',
      })
      toast.success('Task added!')
      setQuickAddTitle('')
      setQuickAddDate(null)
      refetch()
    } catch (error) {
      toast.error('Failed to add task')
    } finally {
      setIsSubmittingQuickAdd(false)
    }
  }

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

    const dateStr = toLocalDateString(date)
    const events: any[] = []

    // monthData.events is currently a Record<string, any[]> indexed by first-match startDate.
    // We iterate all events to see if the current day falls within the task's active range.
    Object.values(monthData.events).flat().forEach((event: any) => {
      const task = event.task || {}
      const taskStatus = task.status || event.status
      const taskStartDate = task.startDate || event.startDate
      const taskDueDate = task.dueDate || event.dueDate
      const taskCompletedAt = task.completedAt || event.completedAt

      if (!isValidDate(taskStartDate)) return;

      const isCompleted = taskStatus === 'COMPLETED'
      const start = toLocalDateString(taskStartDate)
      const today = toLocalDateString(new Date())
      
      // Derive effective visual end date for the grid
      let end: string
      if (isCompleted) {
          // Finished: end at completion or the synced endDate
          const compDate = taskCompletedAt || event.endDate || taskDueDate || taskStartDate
          end = toLocalDateString(compDate)
      } else {
          // Pending: end at max(today, dueDate) to ensure it stays visible until finished
          const dueDateStr = taskDueDate ? toLocalDateString(taskDueDate) : null
          end = (dueDateStr && dueDateStr > today) ? dueDateStr : today
      }

      if (dateStr >= start && dateStr <= end) {
        events.push(event)
      }
    })

    // De-duplicate in case of multiple event fragments for same task
    const taskId = (t: any) => t.taskId || t.id
    return events.filter((v, i, a) => a.findIndex(t => taskId(t) === taskId(v)) === i)
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
                {(['month', 'week', 'day', 'gantt'] as const).map((viewType) => (
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

          {/* Calendar Views */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : view === 'gantt' ? (
            <GanttChart
              currentDate={currentDate}
              events={Object.values(monthData?.events || {}).flat()}
            />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Month view grid... */}
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
                    className={`group p-2 sm:p-3 min-h-[80px] sm:min-h-[120px] border border-gray-200 bg-white hover:bg-gray-50 transition-colors relative ${isToday ? 'ring-2 ring-primary-500' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary-600' : 'text-gray-900'
                        }`}>
                        {day.getDate()}
                      </div>
                      <Link
                        href={`/tasks/new?date=${toLocalDateString(day)}`}
                        className="opacity-0 group-hover:opacity-100 p-1 text-primary-500 hover:bg-primary-50 rounded transition-all"
                        title="Add task for this day"
                      >
                        <Plus className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="space-y-1">
                      {quickAddDate === day.toISOString() ? (
                        <div className="mt-1">
                          <input
                            autoFocus
                            type="text"
                            value={quickAddTitle}
                            onChange={(e) => setQuickAddTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickAdd(day)
                              if (e.key === 'Escape') {
                                setQuickAddDate(null)
                                setQuickAddTitle('')
                              }
                            }}
                            onBlur={() => {
                              if (!quickAddTitle.trim()) setQuickAddDate(null)
                            }}
                            disabled={isSubmittingQuickAdd}
                            placeholder="Type title..."
                            className="w-full p-1 text-[10px] border border-primary-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAddDate(day.toISOString())}
                          className="w-full text-left p-1 text-[10px] text-gray-400 hover:bg-gray-100 rounded italic opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          + Quick add
                        </button>
                      )}

                      <div className="max-h-[100px] overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
                        {dayEvents.map((event: any) => {
                          const taskPayload = event.task || event
                          const id = event.taskId || event.id

                          const dateStr = toLocalDateString(day)

                          if (!isValidDate(event.startDate)) return null;
                          const startStr = toLocalDateString(event.startDate)

                          const endDateVal = event.endDate || event.startDate
                          if (!isValidDate(endDateVal)) return null;
                          const endStr = toLocalDateString(endDateVal)

                          const dueDateStr = event.dueDate && isValidDate(event.dueDate)
                            ? toLocalDateString(event.dueDate)
                            : null
                          const todayStr = toLocalDateString(new Date())

                          const isCompleted = event.status === 'COMPLETED'
                          const isDelayed = !isCompleted && dueDateStr && dateStr > dueDateStr
                          const isStart = dateStr === startStr
                          const isEnd = dateStr === endStr || (!isCompleted && dateStr === todayStr && dateStr > endStr)

                          // Sync with Gantt chart colors: Completed (Green), Overdue (Red), On-Track (Orange)
                          const baseStyle = isCompleted
                            ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm'
                            : (isDelayed
                                ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-sm'
                                : 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 shadow-sm')

                          return (
                            <Link
                              key={event.id}
                              href={`/tasks/${id}`}
                              className={`block p-1 text-[10px] sm:text-xs truncate transition-all border ${baseStyle} ${isStart ? 'rounded-l' : ''
                                } ${isEnd ? 'rounded-r' : 'border-r-0'} ${!isStart && !isEnd ? 'rounded-none' : ''
                                }`}
                            >
                              <div className="flex items-center">
                                {isDelayed && dateStr === todayStr && <AlertCircle className="h-2 w-2 mr-1 flex-shrink-0 animate-pulse" />}
                                <span className="truncate">{isStart ? event.title : '\u00A0'}</span>
                                {isCompleted && isEnd && <span className="ml-auto text-[8px]">✓</span>}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
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
            {isUpcomingLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : upcomingData && upcomingData.length > 0 ? (
              <div className="space-y-4">
                {upcomingData.slice(0, 5).map((event: any) => {
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
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
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