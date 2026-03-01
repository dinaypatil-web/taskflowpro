'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import { tasksApi } from '@/lib/api/tasks'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
    ArrowLeft,
    Calendar,
    Clock,
    Flag,
    User,
    Edit,
    Trash2,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Phone,
    MessageSquare,
    ExternalLink,
    Paperclip,
    Download,
    FileText,
    Image as ImageIcon,
    File,
    Upload,
    X
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatStatus, getPriorityColor, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { AuthProtectedPage } from '@/components/ClientOnly'
import { useState } from 'react'

interface TaskDetailsPageProps {
    params: {
        id: string
    }
}

export default function TaskDetailsPage({ params }: TaskDetailsPageProps) {
    return (
        <AuthProtectedPage>
            <TaskDetailsContent id={params.id} />
        </AuthProtectedPage>
    )
}

function TaskDetailsContent({ id }: { id: string }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isUploading, setIsUploading] = useState(false)

    const { data: task, isLoading, isError } = useQuery(
        ['task', id],
        () => tasksApi.getTask(id),
        {
            onError: () => {
                toast.error('Failed to load task details')
            }
        }
    )

    const updateStatusMutation = useMutation(
        (status: string) => tasksApi.updateTask(id, { status: status as any }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['task', id])
                queryClient.invalidateQueries('tasks')
                toast.success('Task status updated')
            }
        }
    )

    const updateAttachmentsMutation = useMutation(
        (attachments: any[]) => tasksApi.updateTask(id, { attachments }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['task', id])
                toast.success('Attachments updated')
            }
        }
    )

    const deleteMutation = useMutation(
        () => tasksApi.deleteTask(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('tasks')
                toast.success('Task deleted')
                router.push('/tasks')
            }
        }
    )

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteMutation.mutate()
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const attachment = await tasksApi.uploadFile(file)
            const currentAttachments = task?.attachments || []
            await updateAttachmentsMutation.mutateAsync([...currentAttachments, attachment])
            toast.success('File uploaded successfully')
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Failed to upload file')
        } finally {
            setIsUploading(false)
        }
    }

    const removeAttachment = (index: number) => {
        const newAttachments = [...(task?.attachments || [])]
        newAttachments.splice(index, 1)
        updateAttachmentsMutation.mutate(newAttachments)
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
        if (type === 'application/pdf') return <FileText className="h-5 w-5" />
        return <File className="h-5 w-5" />
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

    if (isError || !task) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Task Not Found</h3>
                    <p className="mt-1 text-sm text-gray-500">The task you are looking for does not exist or has been deleted.</p>
                    <Link href="/tasks" className="mt-6 inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tasks
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                {/* Breadcrumbs & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <Link href="/tasks" className="hover:text-primary-600">Tasks</Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-gray-900 font-medium">Task Details</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/tasks/${id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Task Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div className="space-y-4 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(task.status)}`}>
                                        {formatStatus(task.status)}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                                        <Flag className="h-3 w-3 mr-1" />
                                        {task.priority}
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                    {task.title}
                                </h1>
                                {task.description && (
                                    <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                                        {task.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:w-48">
                                {task.status !== 'COMPLETED' ? (
                                    <button
                                        onClick={() => updateStatusMutation.mutate('COMPLETED')}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-100"
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Mark Complete
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => updateStatusMutation.mutate('PENDING')}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-100"
                                    >
                                        <AlertCircle className="h-5 w-5 mr-2" />
                                        Reopen Task
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Start Date</p>
                                    <p className="text-gray-900 font-semibold">{task.startDate ? formatDate(task.startDate) : formatDate(task.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${task.dueDate ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Due Date</p>
                                    <p className="text-gray-900 font-semibold">{task.dueDate ? formatDate(task.dueDate) : 'No due date set'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600`}>
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Completed</p>
                                    <p className="text-gray-900 font-semibold">{task.completedAt ? formatDate(task.completedAt) : 'In Progress'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <Paperclip className="h-5 w-5 mr-2 text-primary-500" />
                            Attachments
                        </h2>
                        <label className="cursor-pointer inline-flex items-center px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors">
                            <Upload className="h-4 w-4 mr-2" />
                            Add File
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                    </div>
                    <div className="p-6">
                        {isUploading && (
                            <div className="flex items-center justify-center p-4 mb-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <LoadingSpinner size="sm" />
                                <span className="ml-3 text-sm text-gray-500">Uploading file...</span>
                            </div>
                        )}

                        {task.attachments && task.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {task.attachments.map((attachment: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all group"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:text-primary-500 transition-colors">
                                            {getFileIcon(attachment.type)}
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {attachment.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(attachment.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                                                title="Download/View"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                                                title="Remove"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !isUploading && (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm italic">No files attached to this task.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Stakeholders Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <User className="h-5 w-5 mr-2 text-primary-500" />
                            Assigned Stakeholders
                        </h2>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold">
                            {task.taskStakeholders?.length || 0}
                        </span>
                    </div>
                    <div className="p-2 sm:p-4">
                        {task.taskStakeholders && task.taskStakeholders.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {task.taskStakeholders.map((ts: any) => (
                                    <Link
                                        key={ts.stakeholder.id}
                                        href={`/stakeholders/${ts.stakeholder.id}`}
                                        className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm mr-3">
                                            {ts.stakeholder.firstName.charAt(0)}{ts.stakeholder.lastName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {ts.stakeholder.firstName} {ts.stakeholder.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {ts.stakeholder.emails?.[0] || ts.stakeholder.email || ts.stakeholder.organization || 'Stakeholder'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            {(ts.stakeholder.phones?.[0] || ts.stakeholder.phone) && (
                                                <>
                                                    <a
                                                        href={`tel:${(ts.stakeholder.phones?.[0] || ts.stakeholder.phone).replace(/\s+/g, '')}`}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100"
                                                        title="Call Stakeholder"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${(ts.stakeholder.phones?.[0] || ts.stakeholder.phone).replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-100"
                                                        title="WhatsApp Stakeholder"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </a>
                                                </>
                                            )}
                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm italic">No stakeholders assigned to this task.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
