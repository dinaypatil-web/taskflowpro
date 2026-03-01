'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { tasksApi } from '@/lib/api/tasks'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { Attachment, CreateTaskRequest, Priority } from '@/types/task'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ArrowLeft, Plus, X, Calendar, Flag, Users, FileText, Upload, Paperclip, File, Image as ImageIcon, FileText as FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getPriorityColor } from '@/lib/utils'
import { QuickCreateStakeholder } from '@/components/stakeholders/QuickCreateStakeholder'
import { Stakeholder } from '@/types/task'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

export default function NewTaskPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div></DashboardLayout>}>
      <NewTaskPageContent />
    </Suspense>
  )
}

function NewTaskPageContent() {
  const router = useRouter()
  const queryParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showQuickCreateStakeholder, setShowQuickCreateStakeholder] = useState(false)
  const initialDate = queryParams.get('date')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      startDate: new Date().toISOString().slice(0, 16),
      dueDate: initialDate ? `${initialDate}T12:00` : undefined,
    },
  })

  const selectedPriority = watch('priority')

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

  const createMutation = useMutation(
    (data: CreateTaskRequest) => tasksApi.createTask(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks')
        toast.success('Task created successfully!')
        router.push('/tasks')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to create task'
        toast.error(message)
      },
    }
  )

  const onSubmit = (data: TaskFormData) => {
    createMutation.mutate({
      ...data,
      description: data.description || undefined,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      stakeholderIds: selectedStakeholderIds.length > 0 ? selectedStakeholderIds : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    })
  }

  const toggleStakeholder = (id: string) => {
    setSelectedStakeholderIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleStakeholderCreated = (stakeholder: Stakeholder) => {
    setSelectedStakeholderIds(prev => [...prev, stakeholder.id])
    setShowQuickCreateStakeholder(false)
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/tasks"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Task</h1>
            <p className="text-sm sm:text-base text-gray-600">Add a new task to your workflow</p>
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
                autoFocus
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

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4" />
                  <span>Priority</span>
                </div>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {priorities.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`
                      relative flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-all
                      ${selectedPriority === value
                        ? `${getPriorityColor(value)} border-current font-semibold ring-2 ring-offset-1`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register('priority')}
                      className="sr-only"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
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
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
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
                  <span className="text-sm text-gray-500 group-hover:text-primary-600 font-medium">Click to upload files</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            {/* Stakeholder Assignment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Assign Stakeholders</span>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCreateStakeholder(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create New
                </button>
              </div>

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
                        {stakeholder.firstName} {stakeholder.lastName}
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
                        {stakeholder.firstName.charAt(0)}{stakeholder.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{stakeholder.firstName} {stakeholder.lastName}</span>
                        {stakeholder.organization && (
                          <span className="text-gray-400 ml-2">· {stakeholder.organization}</span>
                        )}
                      </div>
                      {selectedStakeholderIds.includes(stakeholder.id) && (
                        <span className="text-primary-500 text-xs font-medium">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No stakeholders found.{' '}
                  <Link href="/stakeholders/new" className="text-primary-500 hover:underline">
                    Add a stakeholder
                  </Link>{' '}
                  first.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/tasks"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isLoading || isUploading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-lg shadow-primary-100"
              >
                {createMutation.isLoading && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Create Task
              </button>
            </div>
          </form>
        </div>

        {/* Quick Create Stakeholder Modal */}
        {showQuickCreateStakeholder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <QuickCreateStakeholder
                onSuccess={handleStakeholderCreated}
                onClose={() => setShowQuickCreateStakeholder(false)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
