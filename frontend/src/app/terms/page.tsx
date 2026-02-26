import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'Terms of Service - TaskFlow Pro',
    description: 'Terms of Service for the TaskFlow Pro task management platform.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/auth/register"
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium inline-flex items-center mb-8"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

                <div className="prose prose-gray max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                        <p className="text-gray-600">
                            By accessing or using TaskFlow Pro, you agree to be bound by these Terms of Service.
                            If you do not agree, please do not use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                        <p className="text-gray-600">
                            TaskFlow Pro is a task management and scheduling platform that provides tools for
                            managing tasks, reminders, stakeholder communications, and calendar events.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
                        <p className="text-gray-600">
                            You are responsible for maintaining the confidentiality of your account credentials.
                            You agree to notify us immediately of any unauthorized use of your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
                        <p className="text-gray-600">
                            You agree not to use TaskFlow Pro for any unlawful purposes or in a way that could
                            damage, disable, or impair the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data and Privacy</h2>
                        <p className="text-gray-600">
                            Your use of TaskFlow Pro is also governed by our{' '}
                            <Link href="/privacy" className="text-primary-500 hover:text-primary-600">
                                Privacy Policy
                            </Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
                        <p className="text-gray-600">
                            TaskFlow Pro is provided &quot;as is&quot; without warranties of any kind. We shall not
                            be liable for any indirect, incidental, or consequential damages.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
                        <p className="text-gray-600">
                            For questions about these terms, contact us at{' '}
                            <a href="mailto:dinaypatil.web@gmail.com" className="text-primary-500 hover:text-primary-600">
                                dinaypatil.web@gmail.com
                            </a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
