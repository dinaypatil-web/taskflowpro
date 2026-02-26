import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'Privacy Policy - TaskFlow Pro',
    description: 'Privacy Policy for the TaskFlow Pro task management platform.',
}

export default function PrivacyPage() {
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

                <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

                <div className="prose prose-gray max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                        <p className="text-gray-600">
                            When you create an account, we collect your name, email address, and optionally your
                            phone number. We also collect task data, reminders, and calendar events you create
                            within the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
                        <p className="text-gray-600">
                            Your information is used to provide and improve the TaskFlow Pro service, including
                            sending task reminders via email, SMS, or WhatsApp as you configure. We do not sell
                            your personal data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Storage</h2>
                        <p className="text-gray-600">
                            Your data is stored securely using Firebase Firestore with encryption at rest and
                            in transit. We implement industry-standard security measures to protect your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
                        <p className="text-gray-600">
                            We use third-party services for email delivery (Brevo), SMS notifications (Fast2SMS),
                            and authentication (Firebase). These services have their own privacy policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
                        <p className="text-gray-600">
                            You can request access to, correction of, or deletion of your personal data at any
                            time by contacting us. You may also export your data from your account settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
                        <p className="text-gray-600">
                            We use essential cookies for authentication and session management. No third-party
                            tracking cookies are used.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
                        <p className="text-gray-600">
                            For privacy-related questions, contact us at{' '}
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
