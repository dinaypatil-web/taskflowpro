'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { tasksApi } from '@/lib/api/tasks'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { usersApi } from '@/lib/api/users'
import { Attachment, UpdateTaskRequest, Priority, TaskStatus } from '@/types/task'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Check, X, Calendar, Flag, Users, FileText, Upload, Paperclip, File, Image as ImageIcon, FileText as FileTextIcon, AlertCircle, UserCheck } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getPriorityColor, getStatusColor, formatStatus, isValidDate } from '@/lib/utils'

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    assigneeUserId: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface EditTaskPageProps {
    params: {
        id: string
    }
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const taskId = params.id

    const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<string[]>([])
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const { data: task, isLoading: isTaskLoading, isError } = useQuery(
        ['task', taskId],
        () => tasksApi.getTask(taskId),
        {
            onSuccess: (data) => {
                if (data.taskStakeholders) {
                    setSelectedStakeholderIds(data.taskStakeholders.map(ts => ts.stakeholderId))
                }
                if (data.attachments) {
                    setAttachments(data.attachments)
                }
            }
        }
    )

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
    })

    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status,
                startDate: task.startDate && isValidDate(task.startDate) ? new Date(task.startDate).toISOString().slice(0, 16) : '',
                dueDate: task.dueDate && isValidDate(task.dueDate) ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
                assigneeUserId: task.assigneeUserId || '',
            })
        }
    }, [task, reset])

    const selectedPriority = watch('priority')
    const selectedStatus = watch('status')

    // Fetch stakeholders for the assignment picker
    const { data: stakeholdersData } = useQuery(
        'stakeholders',
        () => stakeholdersApi.getStakeholders({
            limit: 100,
            sortBy: 'firstName',
            sortOrder: 'asc'
        }),
        { staleTime: 30000 }
    )

    // Fetch available users for system assignment
    const { data: assigneesData } = useQuery(
        'availableAssignees',
        () => usersApi.getAvailableAssignees(),
        { staleTime: 60000 }
    )

    const updateMutation = useMutation(
        (data: UpdateTaskRequest) => tasksApi.updateTask(taskId, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['task', taskId])
                queryClient.invalidateQueries('tasks')
                toast.success('Task updated successfully!')
                router.push(`/tasks/${taskId}`)
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || 'Failed to update task'
                toast.error(message)
            },
        }
    )

    const onSubmit = (data: TaskFormData) => {
        updateMutation.mutate({
            ...data,
            description: data.description || undefined,
            startDate: data.startDate && isValidDate(data.startDate) ? new Date(data.startDate).toISOString() : undefined,
            dueDate: data.dueDate && isValidDate(data.dueDate) ? new Date(data.dueDate).toISOString() : undefined,
            stakeholderIds: selectedStakeholderIds,
            attachments: attachments,
        })
    }

    const toggleStakeholder = (id: string) => {
        setSelectedStakeholderIds(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        )
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const attachment = await tasksApi.uploadFile(file)
            setAttachments(prev => [...prev, attachment])
            toast.success('File uploaded successfully')
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Failed to upload file')
        } finally {
            setIsUploading(false)
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
        if (type === 'application/pdf') return <FileTextIcon className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    const priorities: { value: Priority; label: string }[] = [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
    ]

    const statuses: { value: TaskStatus; label: string }[] = [
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ]

    if (isTaskLoading) {
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
                    <p className="mt-1 text-sm text-gray-500">The task you are trying to edit does not exist.</p>
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
            <div className="max-w-2xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Link
                        href={`/tasks/${taskId}`}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Task</h1>
                        <p className="text-sm sm:text-base text-gray-600">Update task details and preferences</p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Title *</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                id="title"
                                {...register('title')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter task title"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                {...register('description')}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                placeholder="Add a description for your task (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    {...register('status')}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-medium ${getStatusColor(selectedStatus as TaskStatus)} bg-opacity-10 border-opacity-20`}
                                >
                                    {statuses.map(({ value, label }) => (
                                        <option key={value} value={value} className="text-gray-900 bg-white">{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>
                                <select
                                    {...register('priority')}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-medium ${getPriorityColor(selectedPriority as Priority)} bg-opacity-10 border-opacity-20`}
                                >
                                    {priorities.map(({ value, label }) => (
                                        <option key={value} value={value} className="text-gray-900 bg-white">{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Start Date</span>
                                    </div>
                                </label>
                                <input
                                    type="datetime-local"
                                    id="startDate"
                                    {...register('startDate')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Due Date</span>
                                    </div>
                                </label>
                                <input
                                    type="datetime-local"
                                    id="dueDate"
                                    {...register('dueDate')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Paperclip className="h-4 w-4" />
                                    <span>Attachments</span>
                                </div>
                            </label>

                            <div className="space-y-3">
                                {attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center overflow-hidden">
                                            <div className="p-2 bg-white rounded border border-gray-100 text-gray-400 mr-2 shrink-0">
                                                {getFileIcon(attachment.type)}
                                            </div>
                                            <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-primary-500">
                                                <ArrowLeft className="h-4 w-4 rotate-180" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {isUploading && (
                                    <div className="flex items-center p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2 text-xs text-gray-500">Uploading...</span>
                                    </div>
                                )}

                                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
                                    <Upload className="h-4 w-4 mr-2 text-gray-400 group-hover:text-primary-500" />
                                    <span className="text-sm text-gray-500 group-hover:text-primary-600 font-medium">Click to upload more files</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                            </div>
                        </div>

                        {/* User Assignment */}
                        <div>
                            <label htmlFor="assigneeUserId" className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <UserCheck className="h-4 w-4" />
                                    <span>Assign to User (Internal)</span>
                                </div>
                            </label>
                            <select
                                id="assigneeUserId"
                                {...register('assigneeUserId')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Select Internal User (optional)</option>
                                {assigneesData?.map(assignee => (
                                    <option key={assignee.id} value={assignee.id}>
                                        {assignee.firstName} {assignee.lastName || ''} ({assignee.department || 'No Dept'})
                                    </option>
                                ))}
                            </select>
                            {assigneesData && assigneesData.length === 0 && (
                                <p className="mt-1 text-xs text-gray-500 italic">No eligible internal users found for assignment.</p>
                            )}
                        </div>

                        {/* Stakeholder Assignment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4" />
                                    <span>Assigned Stakeholders</span>
                                </div>
                            </label>

                            {/* Selected stakeholders */}
                            {selectedStakeholderIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedStakeholderIds.map(id => {
                                        const stakeholder = stakeholdersData?.stakeholders?.find(s => s.id === id)
                                        if (!stakeholder) return null
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                                            >
                                                {stakeholder.firstName} {stakeholder.lastName || ''}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStakeholder(id)}
                                                    className="ml-2 text-primary-600 hover:text-primary-800"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Stakeholder list */}
                            {stakeholdersData?.stakeholders && stakeholdersData.stakeholders.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                                    {stakeholdersData.stakeholders.map(stakeholder => (
                                        <button
                                            key={stakeholder.id}
                                            type="button"
                                            onClick={() => toggleStakeholder(stakeholder.id)}
                                            className={`w-full flex items-center px-3 py-2 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0
                        ${selectedStakeholderIds.includes(stakeholder.id)
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                                }
                      `}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3
                        ${selectedStakeholderIds.includes(stakeholder.id)
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                                }
                      `}>
                                                {stakeholder.firstName?.charAt(0)}{stakeholder.lastName?.charAt(0) || ''}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-medium">{stakeholder.firstName} {stakeholder.lastName || ''}</span>
                                                {stakeholder.organization && (
                                                    <span className="text-gray-400 ml-2">· {stakeholder.organization}</span>
                                                )}
                                            </div>
                                            {selectedStakeholderIds.includes(stakeholder.id) && (
                                                <Check className="h-4 w-4 text-primary-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    No stakeholders available to assign.
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link
                                href={`/tasks/${taskId}`}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={updateMutation.isLoading || isUploading}
                                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-lg shadow-primary-100 font-bold"
                            >
                                {updateMutation.isLoading && (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}
