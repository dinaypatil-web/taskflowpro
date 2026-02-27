'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SaveToContacts } from '@/components/contacts/SaveToContacts'
import { AuthProtectedPage } from '@/components/ClientOnly'
import { ImportDeviceContacts } from './components/ImportDeviceContacts'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Users,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function StakeholdersPage() {
  return (
    <AuthProtectedPage>
      <StakeholdersPageContent />
    </AuthProtectedPage>
  )
}

function StakeholdersPageContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrganization, setSelectedOrganization] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['stakeholders', searchTerm, selectedOrganization],
    () => stakeholdersApi.getStakeholders({
      search: searchTerm || undefined,
      organization: selectedOrganization || undefined,
      limit: 50,
      sortBy: 'firstName',
      sortOrder: 'asc'
    }),
    { enabled: isAuthenticated }
  )

  const stakeholders = data?.stakeholders || []
  const organizations = Array.from(new Set(stakeholders.map(s => s.organization).filter(Boolean)))

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stakeholders</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your contacts and stakeholders</p>
          </div>
          <div className="flex items-center gap-3">
            <ImportDeviceContacts onImportSuccess={refetch} />
            <Link
              href="/stakeholders/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search stakeholders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base">
                <Filter className="h-4 w-4 inline mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error loading stakeholders: {(error as any)?.message || 'Unknown error'}.
                  Please check your connection and ensure the API is reachable.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stakeholders List */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 px-4">
              <Users className="mx-auto h-12 w-12 text-gray-400 opacity-20" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load data</h3>
            </div>
          ) : stakeholders.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stakeholders</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new stakeholder.
              </p>
              <div className="mt-6">
                <Link
                  href="/stakeholders/new"
                  className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stakeholder
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stakeholders.map((stakeholder) => (
                      <tr key={stakeholder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {stakeholder.firstName?.charAt(0).toUpperCase()}{stakeholder.lastName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {stakeholder.firstName} {stakeholder.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {stakeholder.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {stakeholder.email}
                              </div>
                            )}
                            {stakeholder.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {stakeholder.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {stakeholder.organization && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Building className="h-3 w-3 mr-1" />
                              {stakeholder.organization}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {stakeholder.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(stakeholder.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <SaveToContacts
                              stakeholder={{
                                firstName: stakeholder.firstName,
                                lastName: stakeholder.lastName,
                                email: stakeholder.email,
                                phone: stakeholder.phone,
                                organization: stakeholder.organization,
                              }}
                            />
                            <Link
                              href={`/stakeholders/${stakeholder.id}/edit`}
                              className="text-primary-600 hover:text-primary-700 p-1"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this stakeholder?')) {
                                  // Handle delete
                                }
                              }}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {stakeholder.firstName?.charAt(0).toUpperCase()}{stakeholder.lastName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {stakeholder.firstName} {stakeholder.lastName}
                          </h3>
                          <div className="mt-1 space-y-1">
                            {stakeholder.email && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{stakeholder.email}</span>
                              </div>
                            )}
                            {stakeholder.phone && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span>{stakeholder.phone}</span>
                              </div>
                            )}
                            {stakeholder.organization && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{stakeholder.organization}</span>
                              </div>
                            )}
                          </div>
                          {stakeholder.tags && stakeholder.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {stakeholder.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {stakeholder.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{stakeholder.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Created {formatDate(stakeholder.createdAt)}
                          </div>
                          <div className="mt-3">
                            <SaveToContacts
                              stakeholder={{
                                firstName: stakeholder.firstName,
                                lastName: stakeholder.lastName,
                                email: stakeholder.email,
                                phone: stakeholder.phone,
                                organization: stakeholder.organization,
                              }}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2 ml-4">
                        <Link
                          href={`/stakeholders/${stakeholder.id}/edit`}
                          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this stakeholder?')) {
                              // Handle delete
                            }
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
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
                  Showing <span className="font-medium">{((data.page - 1) * data.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(data.page * data.limit, data.total)}
                  </span>{' '}
                  of <span className="font-medium">{data.total}</span> results
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}