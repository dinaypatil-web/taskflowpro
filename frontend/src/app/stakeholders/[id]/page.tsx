'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    Tag,
    Edit,
    Trash2,
    CheckSquare,
    ChevronRight,
    User,
    ExternalLink,
    MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatStatus, getStatusColor, getPriorityColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { SaveToContacts } from '@/components/contacts/SaveToContacts'
import { AuthProtectedPage } from '@/components/ClientOnly'

interface StakeholderDetailsPageProps {
    params: {
        id: string
    }
}

export default function StakeholderDetailsPage({ params }: StakeholderDetailsPageProps) {
    return (
        <AuthProtectedPage>
            <StakeholderDetailsContent id={params.id} />
        </AuthProtectedPage>
    )
}

function StakeholderDetailsContent({ id }: { id: string }) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data: stakeholder, isLoading, isError } = useQuery(
        ['stakeholder', id],
        () => stakeholdersApi.getStakeholder(id),
        {
            onError: () => {
                toast.error('Failed to load stakeholder details')
            }
        }
    )

    const deleteMutation = useMutation(
        () => stakeholdersApi.deleteStakeholder(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('stakeholders')
                toast.success('Stakeholder deleted')
                router.push('/stakeholders')
            }
        }
    )

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this stakeholder? This will not delete their tasks.')) {
            deleteMutation.mutate()
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    if (isError || !stakeholder) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Stakeholder Not Found</h3>
                    <p className="mt-1 text-sm text-gray-500">The stakeholder you are looking for does not exist or has been removed.</p>
                    <Link href="/stakeholders" className="mt-6 inline-flex items-center text-primary-600 hover:text-primary-700 font-medium font-bold">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Stakeholders
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Breadcrumbs & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <Link href="/stakeholders" className="hover:text-primary-600 font-medium">Stakeholders</Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-gray-900 font-bold">Stakeholder Profile</span>
                    </div>
                    <div className="flex items-center gap-3">
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
                            href={`/stakeholders/${id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold shadow-sm"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold shadow-sm"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 pb-10 flex flex-col items-center sm:flex-row sm:items-start text-center sm:text-left gap-8">
                        <div className="h-32 w-32 rounded-3xl bg-primary-100 flex items-center justify-center text-primary-600 text-5xl font-black shadow-lg shadow-primary-50">
                            {stakeholder.firstName.charAt(0)}{stakeholder.lastName.charAt(0)}
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black text-gray-900">
                                    {stakeholder.firstName} {stakeholder.lastName}
                                </h1>
                                {stakeholder.organization && (
                                    <p className="text-primary-600 font-bold flex items-center justify-center sm:justify-start">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        {stakeholder.organization}
                                    </p>
                                )}
                            </div>

                            {stakeholder.tags && stakeholder.tags.length > 0 && (
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    {stakeholder.tags.map((tag: string) => (
                                        <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                                            <Tag className="h-3 w-3 mr-1" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                                <a
                                    href={`mailto:${stakeholder.email}`}
                                    className={`flex items-center p-3 rounded-xl border-2 transition-all ${stakeholder.email ? 'border-primary-100 bg-primary-50 hover:bg-primary-100' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                                >
                                    <Mail className="h-5 w-5 text-primary-500 mr-3" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[10px] font-black tracking-widest text-primary-400 uppercase">Email Address</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{stakeholder.email || 'Not provided'}</p>
                                    </div>
                                    {stakeholder.email && <ExternalLink className="h-3 w-3 text-primary-300" />}
                                </a>
                                <a
                                    href={`tel:${stakeholder.phone}`}
                                    className={`flex items-center p-3 rounded-xl border-2 transition-all ${stakeholder.phone ? 'border-green-100 bg-green-50 hover:bg-green-100' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                                >
                                    <Phone className="h-5 w-5 text-green-500 mr-3" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[10px] font-black tracking-widest text-green-400 uppercase">Phone Number</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{stakeholder.phone || 'Not provided'}</p>
                                    </div>
                                    {stakeholder.phone && <ExternalLink className="h-3 w-3 text-green-300" />}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Tasks Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <CheckSquare className="h-5 w-5 mr-3 text-primary-500" />
                            Assigned Tasks
                        </h2>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold">
                            {stakeholder.taskStakeholders?.length || 0}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {stakeholder.taskStakeholders && stakeholder.taskStakeholders.length > 0 ? (
                            stakeholder.taskStakeholders.map((ts: any) => (
                                <Link
                                    key={ts.task.id}
                                    href={`/tasks/${ts.task.id}`}
                                    className="block p-5 hover:bg-gray-50 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${ts.task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-primary-500'}`} />
                                                <h3 className="text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {ts.task.title}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${getStatusColor(ts.task.status)} px-2 py-0.5 rounded`}>
                                                    {ts.task.status}
                                                </span>
                                                {ts.task.dueDate && (
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                        Due {formatDate(ts.task.dueDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-12 px-6">
                                <p className="text-gray-400 italic text-sm">No tasks assigned to this stakeholder yet.</p>
                                <Link
                                    href="/tasks/new"
                                    className="mt-4 inline-flex items-center text-primary-600 font-bold text-xs hover:underline uppercase tracking-widest"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Assign to a New Task
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reminder Logs (Optional/Future) */}
                {stakeholder.reminderLogs && stakeholder.reminderLogs.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <MessageSquare className="h-5 w-5 mr-3 text-orange-500" />
                                Recent Communication
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {stakeholder.reminderLogs.map((log: any) => (
                                <div key={log.id} className="flex items-start gap-4">
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.status === 'SENT' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-900 font-bold leading-none">Reminder {log.status.toLowerCase()}</p>
                                        <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

function Plus({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
