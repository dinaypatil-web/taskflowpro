'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from 'react-query'
import { stakeholdersApi, CreateStakeholderRequest } from '@/lib/api/stakeholders'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { X, User, Mail, Phone, Building, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Stakeholder } from '@/types/task'

const stakeholderSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    emails: z.array(z.object({ value: z.string().email('Invalid email').or(z.literal('')) })),
    phones: z.array(z.object({ value: z.string() })),
    organization: z.string().optional(),
})

type StakeholderFormData = z.infer<typeof stakeholderSchema>

interface QuickCreateStakeholderProps {
    onSuccess: (stakeholder: Stakeholder) => void
    onClose: () => void
}

export function QuickCreateStakeholder({ onSuccess, onClose }: QuickCreateStakeholderProps) {
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
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

    const createMutation = useMutation(
        (data: CreateStakeholderRequest) => stakeholdersApi.createStakeholder(data),
        {
            onSuccess: (newStakeholder) => {
                queryClient.invalidateQueries('stakeholders')
                toast.success('Stakeholder created successfully!')
                onSuccess(newStakeholder)
                onClose()
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || 'Failed to create stakeholder'
                toast.error(message)
            },
        }
    )

    const onSubmit = (data: StakeholderFormData) => {
        createMutation.mutate({
            ...data,
            emails: data.emails.map(e => e.value).filter(Boolean),
            phones: data.phones.map(p => p.value).filter(Boolean),
            organization: data.organization || undefined,
        })
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Quick Add Stakeholder</h3>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                        </label>
                        <input
                            type="text"
                            {...register('firstName')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            placeholder="John"
                        />
                        {errors.firstName && (
                            <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            {...register('lastName')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            placeholder="Doe"
                        />
                        {errors.lastName && (
                            <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

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
                </div>

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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization
                    </label>
                    <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            {...register('organization')}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            placeholder="Acme Inc."
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isLoading}
                        className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center"
                    >
                        {createMutation.isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        Create
                    </button>
                </div>
            </form>
        </div>
    )
}
