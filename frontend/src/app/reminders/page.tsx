'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthProtectedPage } from '@/components/ClientOnly'
import { 
  Bell, 
  Search, 
  Mail, 
  MessageSquare, 
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'
import apiClient from '@/lib/api/client'

interface Reminder {
  id: string
  taskId: string
  userId: string
  stakeholderId?: string
  reminderDate: string
  message: string
  provider: 'EMAIL' | 'SMS' | 'WHATSAPP'
  recipient: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
  sentAt?: string
  deliveredAt?: string
  createdAt: string
  task: {
    id: string
    title: string
    priority: string
    status: string
  }
  stakeholder?: {
    id: string
    name: string
  }
}

export default function RemindersPage() {
  return (
    <AuthProtectedPage>
      <RemindersPageContent />
    </AuthProtectedPage>
  )
}

function RemindersPageContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')

  const { data: reminders, isLoading } = useQuery(
    ['reminders', searchTerm, statusFilter, providerFilter],
    async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (providerFilter) params.append('provider', providerFilter)
      params.append('limit', '50')
      params.append('sortBy', 'createdAt')
      params.append('sortOrder', 'desc')

      const response = await apiClient.get(`/reminders?${params.toString()}`)
      return response.data
    },
    { enabled: isAuthenticated }
  )

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'SENT':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'SENT':
        return 'text-blue-600 bg-blue-100'
      case 'DELIVERED':
        return 'text-green-600 bg-green-100'
      case 'FAILED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />
      case 'SMS':
        return <Phone className="h-4 w-4" />
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const remindersList = reminders?.reminders || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
            <p className="text-gray-600">Track your notification history and status</p>
          </div>
          <Link
            href="/tasks/new"
            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {remindersList.filter((r: Reminder) => r.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {remindersList.filter((r: Reminder) => r.status === 'SENT').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {remindersList.filter((r: Reminder) => r.status === 'DELIVERED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {remindersList.filter((r: Reminder) => r.status === 'FAILED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search reminders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="sm:w-40">
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Providers</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reminders List */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : remindersList.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders</h3>
              <p className="mt-1 text-sm text-gray-500">
                Reminders will appear here when you create tasks with stakeholders.
              </p>
              <div className="mt-6">
                <Link
                  href="/tasks/new"
                  className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {remindersList.map((reminder: Reminder) => (
                <div key={reminder.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getProviderIcon(reminder.provider)}
                          <span className="text-sm font-medium text-gray-900">
                            {reminder.provider}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                          {getStatusIcon(reminder.status)}
                          <span className="ml-1">{reminder.status}</span>
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <Link
                          href={`/tasks/${reminder.taskId}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {reminder.task.title}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          To: {reminder.recipient}
                          {reminder.stakeholder && (
                            <span className="ml-2">({reminder.stakeholder.name})</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <div>Scheduled: {formatDateTime(reminder.reminderDate)}</div>
                        {reminder.sentAt && (
                          <div>Sent: {formatDateTime(reminder.sentAt)}</div>
                        )}
                        {reminder.deliveredAt && (
                          <div>Delivered: {formatDateTime(reminder.deliveredAt)}</div>
                        )}
                      </div>
                      
                      {reminder.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{reminder.message}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatDate(reminder.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {reminders && reminders.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((reminders.page - 1) * reminders.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(reminders.page * reminders.limit, reminders.total)}
                  </span>{' '}
                  of <span className="font-medium">{reminders.total}</span> results
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}