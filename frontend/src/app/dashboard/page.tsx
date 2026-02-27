'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from 'react-query'
import { tasksApi } from '@/lib/api/tasks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TaskStats } from '@/components/dashboard/TaskStats'
import { RecentTasks } from '@/components/dashboard/RecentTasks'
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Sparkles, Zap } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch dashboard data
  const { data: tasks, isLoading: tasksLoading, isError: tasksHasError, error: tasksError } = useQuery(
    'dashboard-tasks',
    () => tasksApi.getTasks({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
    { enabled: isAuthenticated }
  )

  const { data: taskStats, isLoading: statsLoading, isError: statsHasError, error: statsError } = useQuery(
    'task-stats',
    () => tasksApi.getTaskStats(),
    { enabled: isAuthenticated }
  )

  const { data: upcomingTasks, isLoading: upcomingLoading, isError: upcomingHasError, error: upcomingError } = useQuery(
    'upcoming-tasks',
    () => tasksApi.getUpcomingTasks(7),
    { enabled: isAuthenticated }
  )
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <LoadingSpinner size="lg" variant="gradient" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="glass-card animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                <h1 className="text-3xl font-bold text-gradient-primary">
                  Welcome back, {user?.firstName}!
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Ready to tackle your tasks today? Let's make it productive! ✨
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center animate-float">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up animate-stagger-2">
          <QuickActions />
        </div>

        <div className="animate-fade-in-up animate-stagger-3">
          <TaskStats
            stats={taskStats}
            isLoading={statsLoading}
            isError={statsHasError}
            error={statsError}
          />
        </div>
        Vinc
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <div className="animate-fade-in-up animate-stagger-4">
            <RecentTasks
              tasks={tasks?.tasks || []}
              isLoading={tasksLoading}
              isError={tasksHasError}
              error={tasksError}
            />
          </div>

          {/* Upcoming Tasks */}
          <div className="animate-fade-in-up animate-stagger-4">
            <UpcomingTasks
              tasks={upcomingTasks || []}
              isLoading={upcomingLoading}
              isError={upcomingHasError}
              error={upcomingError}
            />
          </div>
        </div>

        {/* Floating Action Button */}
        <button className="fab group">
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>
    </DashboardLayout>
  )
}