'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true)
        try {
            // TODO: call backend password reset endpoint when implemented
            await new Promise((resolve) => setTimeout(resolve, 1500))
            setIsSubmitted(true)
        } catch (error) {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-semibold text-gray-900">Check your email</h2>
                    <p className="text-gray-600">
                        If an account exists with that email address, we&apos;ve sent password reset instructions.
                    </p>
                    <Link
                        href="/auth/login"
                        className="btn-primary btn-lg inline-flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-primary-500 mb-2">TaskFlow Pro</h1>
                    <h2 className="text-2xl font-semibold text-gray-900">Reset your password</h2>
                    <p className="mt-2 text-gray-600">
                        Enter your email and we&apos;ll send you instructions to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                {...register('email')}
                                type="email"
                                autoComplete="email"
                                className="input pl-10"
                                placeholder="Enter your email"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary btn-lg w-full flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Sending...
                            </>
                        ) : (
                            'Send reset instructions'
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <Link
                        href="/auth/login"
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium inline-flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
