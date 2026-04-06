'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { stakeholdersApi, UpdateStakeholderRequest } from '@/lib/api/stakeholders'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SaveToContacts } from '@/components/contacts/SaveToContacts'
import { ArrowLeft, Plus, X, Trash2, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { normalizePhoneNumber } from '@/lib/utils'

const stakeholderSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  emails: z.array(z.object({ value: z.string().email('Invalid email').or(z.literal('')) })),
  phones: z.array(z.object({ value: z.string() })),
  organization: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type StakeholderFormData = z.infer<typeof stakeholderSchema>

interface EditStakeholderPageProps {
  params: {
    id: string
  }
}

export default function EditStakeholderPage({ params }: EditStakeholderPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm<StakeholderFormData>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      emails: [{ value: '' }],
      phones: [{ value: '' }],
    }
  })

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: "emails"
  })

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "phones"
  })

  // Fetch stakeholder data
  const { data: stakeholder, isLoading } = useQuery(
    ['stakeholder', params.id],
    () => stakeholdersApi.getStakeholder(params.id),
    {
      onError: () => {
        toast.error('Failed to load stakeholder data')
      }
    }
  )

  // Synchronize form with fetched data
  useEffect(() => {
    if (stakeholder) {
      reset({
        firstName: stakeholder.firstName,
        lastName: stakeholder.lastName || '',
        emails: stakeholder.emails?.length ? stakeholder.emails.map(e => ({ value: e })) : (stakeholder.email ? [{ value: stakeholder.email }] : [{ value: '' }]),
        phones: stakeholder.phones?.length ? stakeholder.phones.map(p => ({ value: p })) : (stakeholder.phone ? [{ value: stakeholder.phone }] : [{ value: '' }]),
        organization: stakeholder.organization || '',
      })
      setTags(stakeholder.tags || [])
    }
  }, [stakeholder, reset])

  const updateMutation = useMutation(
    (data: UpdateStakeholderRequest) => stakeholdersApi.updateStakeholder(params.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stakeholders')
        queryClient.invalidateQueries(['stakeholder', params.id])
        toast.success('Stakeholder updated successfully!')
        router.push('/stakeholders')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to update stakeholder'
        toast.error(message)
      },
    }
  )

  const deleteMutation = useMutation(
    () => stakeholdersApi.deleteStakeholder(params.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stakeholders')
        toast.success('Stakeholder deleted successfully!')
        router.push('/stakeholders')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to delete stakeholder'
        toast.error(message)
      },
    }
  )

  const onSubmit = (data: StakeholderFormData) => {
    updateMutation.mutate({
      ...data,
      tags: tags.length > 0 ? tags : undefined,
      emails: data.emails.map(e => e.value).filter(Boolean),
      phones: data.phones.map(p => normalizePhoneNumber(p.value)).filter(Boolean),
      organization: data.organization || undefined,
    })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this stakeholder? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      setValue('tags', newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    setValue('tags', newTags)
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
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

  if (!stakeholder) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Stakeholder not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The stakeholder you're looking for doesn't exist.
          </p>
          <Link
            href="/stakeholders"
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Back to Stakeholders
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/stakeholders"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Stakeholder</h1>
              <p className="text-sm sm:text-base text-gray-600">Update stakeholder information</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {stakeholder && (
              <SaveToContacts
                stakeholder={{
                  firstName: stakeholder.firstName,
                  lastName: stakeholder.lastName,
                  email: stakeholder.email,
                  phone: stakeholder.phone,
                  organization: stakeholder.organization,
                }}
              />
            )}
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {deleteMutation.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                {...register('firstName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                {...register('lastName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            {/* Emails */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Emails
                </label>
                <button
                  type="button"
                  onClick={() => appendEmail({ value: '' })}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Email
                </button>
              </div>
              {emailFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      {...register(`emails.${index}.value` as const)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                  {emailFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.emails && (
                <p className="mt-1 text-sm text-red-600">{errors.emails.message}</p>
              )}
            </div>

            {/* Phones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Numbers
                </label>
                <button
                  type="button"
                  onClick={() => appendPhone({ value: '' })}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Phone
                </button>
              </div>
              {phoneFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      {...register(`phones.${index}.value` as const)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  {phoneFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                {...register('organization')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter organization name"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/stakeholders"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {updateMutation.isLoading && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Update Stakeholder
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}