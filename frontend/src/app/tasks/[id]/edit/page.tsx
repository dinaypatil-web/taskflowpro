'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { tasksApi } from '@/lib/api/tasks'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { UpdateTaskRequest, Priority } from '@/types/task'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Plus, X, Calendar, Flag, Users, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getPriorityColor } from '@/lib/utils'
import { AuthProtectedPage } from '@/components/ClientOnly'

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface EditTaskPageProps {
    params: {
        id: string
    }
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
    return (
        <AuthProtectedPage>
            <EditTaskContent id={params.id} />
        </AuthProtectedPage>
    )
}

function EditTaskContent({ id }: { id: string }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<string[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
    })

    // Fetch task data
    const { isLoading: isLoadingTask } = useQuery(
        ['task', id],
        () => tasksApi.getTask(id),
        {
            onSuccess: (data) => {
                reset({
                    title: data.title,
                    description: data.description || '',
                    priority: data.priority,
                    dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '',
                })
                setSelectedStakeholderIds(data.taskStakeholders?.map((ts: any) => ts.stakeholder.id) || [])
            },
        }
    )

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

    const updateMutation = useMutation(
        (data: UpdateTaskRequest) => tasksApi.updateTask(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['task', id])
                queryClient.invalidateQueries('tasks')
                toast.success('Task updated successfully!')
                router.push(`/tasks/${id}`)
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || 'Failed to update task'
                toast.error(message)
            },
        }
    )

    const selectedPriority = watch('priority')

    const onSubmit = (data: TaskFormData) => {
        updateMutation.mutate({
            ...data,
            description: data.description || undefined,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
            stakeholderIds: selectedStakeholderIds.length > 0 ? selectedStakeholderIds : undefined,
        })
    }

    const toggleStakeholder = (id: string) => {
        setSelectedStakeholderIds(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        )
    }

    const priorities: { value: Priority; label: string }[] = [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'URGENT', label: 'Urgent' },
    ]

    if (isLoadingTask) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/tasks" className="hover:text-primary-600 font-medium">Tasks</Link>
                    <ChevronRight className="h-4 w-4 mx-2" />
                    <Link href={`/tasks/${id}`} className="hover:text-primary-600 font-medium">Details</Link>
                    <ChevronRight className="h-4 w-4 mx-2" />
                    <span className="text-gray-900 font-bold">Edit Task</span>
                </div>

                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Link
                        href={`/tasks/${id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
                        <p className="text-sm text-gray-600 italic">Adjust your task details and assignments below.</p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
                        {/* Title */}
                        <div className="space-y-2">
                            <label htmlFor="title" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Task Title *
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="title"
                                    {...register('title')}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all font-medium text-gray-900"
                                    placeholder="What needs to be done?"
                                />
                            </div>
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600 font-bold">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Detailed Description
                            </label>
                            <textarea
                                id="description"
                                {...register('description')}
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all font-medium text-gray-900 resize-none"
                                placeholder="Add more context or notes here..."
                            />
                        </div>

                        {/* Priority */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Priority Level
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {priorities.map(({ value, label }) => (
                                    <label
                                        key={value}
                                        className={`
                      relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedPriority === value
                                                ? `${getPriorityColor(value)} border-current bg-white font-bold opacity-100 scale-105 shadow-sm`
                                                : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100 opacity-70'
                                            }
                    `}
                                    >
                                        <input
                                            type="radio"
                                            value={value}
                                            {...register('priority')}
                                            className="sr-only"
                                        />
                                        <Flag className={`h-4 w-4 mr-2 ${selectedPriority === value ? 'animate-pulse' : ''}`} />
                                        <span className="text-sm">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label htmlFor="dueDate" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Target Deadline
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    id="dueDate"
                                    {...register('dueDate')}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all font-medium text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Stakeholder Assignment */}
                        <div className="space-y-4 pt-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                <span>Assigned Stakeholders</span>
                                <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-[10px]">{selectedStakeholderIds.length} Selected</span>
                            </label>

                            {/* Stakeholder list selection */}
                            {stakeholdersData?.stakeholders && stakeholdersData.stakeholders.length > 0 ? (
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                                        {stakeholdersData.stakeholders.map(stakeholder => (
                                            <button
                                                key={stakeholder.id}
                                                type="button"
                                                onClick={() => toggleStakeholder(stakeholder.id)}
                                                className={`w-full flex items-center p-4 text-left transition-all
                          ${selectedStakeholderIds.includes(stakeholder.id)
                                                        ? 'bg-primary-50 text-primary-900'
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                    }
                        `}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mr-4 shadow-sm
                          ${selectedStakeholderIds.includes(stakeholder.id)
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-200 text-gray-500'
                                                    }
                        `}>
                                                    {stakeholder.firstName.charAt(0)}{stakeholder.lastName.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-bold text-sm">{stakeholder.firstName} {stakeholder.lastName}</span>
                                                    {stakeholder.organization && (
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{stakeholder.organization}</p>
                                                    )}
                                                </div>
                                                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStakeholderIds.includes(stakeholder.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-200'}`}>
                                                    {selectedStakeholderIds.includes(stakeholder.id) && <X className="h-4 w-4 text-white" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-gray-500 italic">No stakeholders available to assign.</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-50">
                            <Link
                                href={`/tasks/${id}`}
                                className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Discard Changes
                            </Link>
                            <button
                                type="submit"
                                disabled={updateMutation.isLoading}
                                className="px-10 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-primary-50 flex items-center"
                            >
                                {updateMutation.isLoading && (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                )}
                                Save Task
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}
