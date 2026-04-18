'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthProtectedPage } from '@/components/ClientOnly'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '@/contexts/ThemeContext'
import { usersApi } from '@/lib/api/users'
import { workflowsApi } from '@/lib/api/workflows'
import { useQuery } from 'react-query'
import { Building2, Briefcase, LayoutGrid, Award, GitBranch, ShieldCheck } from 'lucide-react'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  organization: z.string().optional(),
  projectName: z.string().optional(),
  department: z.string().optional(),
  superiorId: z.string().optional(),
  isProjectHead: z.boolean().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  return (
    <AuthProtectedPage>
      <SettingsPageContent />
    </AuthProtectedPage>
  )
}

function SettingsPageContent() {
  const router = useRouter()
  const { user, isAuthenticated, setUser } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      organization: user?.organization || '',
      projectName: user?.projectName || '',
      department: user?.department || '',
      superiorId: user?.superiorId || '',
      isProjectHead: user?.isProjectHead || false,
    },
  })

  const isProjectHead = watch('isProjectHead')

  const { data: superiorsData } = useQuery(
    'availableSuperiors',
    () => usersApi.getAvailableSuperiors(),
    { enabled: isAuthenticated && !!user?.organization }
  )

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation(
    (data: ProfileFormData) => usersApi.updateProfile(data),
    {
      onSuccess: (response) => {
        setUser(response)
        queryClient.invalidateQueries('user')
        toast.success('Profile updated successfully!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to update profile'
        toast.error(message)
      },
    }
  )

  const updatePasswordMutation = useMutation(
    (data: PasswordFormData) => usersApi.updatePassword(data),
    {
      onSuccess: () => {
        resetPasswordForm()
        toast.success('Password updated successfully!')
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to update password'
        toast.error(message)
      },
    }
  )

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    updatePasswordMutation.mutate(data)
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'workflow', name: 'Team Workflow', icon: GitBranch },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'preferences', name: 'Preferences', icon: Palette },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card">
          <h1 className="text-xl sm:text-2xl font-bold text-gradient-primary">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="glass-card">
          <div className="border-b border-white/20 dark:border-white/10">
            <nav className="flex overflow-x-auto px-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-0 pt-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your personal information</p>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...registerProfile('firstName')}
                          type="text"
                          className="input pl-10"
                        />
                      </div>
                      {profileErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...registerProfile('lastName')}
                          type="text"
                          className="input pl-10"
                        />
                      </div>
                      {profileErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...registerProfile('email')}
                        type="email"
                        className="input pl-10"
                      />
                    </div>
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...registerProfile('phone')}
                        type="tel"
                        className="input pl-10"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...registerProfile('organization')}
                          type="text"
                          className="input pl-10"
                          placeholder="e.g. Google"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...registerProfile('projectName')}
                          type="text"
                          className="input pl-10"
                          placeholder="e.g. Project Apollo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department / Section
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LayoutGrid className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          {...registerProfile('department')}
                          type="text"
                          className="input pl-10"
                          placeholder="e.g. Engineering"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Superior / Reporting To
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Award className={`h-4 w-4 ${isProjectHead ? 'text-gray-300' : 'text-gray-400'}`} />
                        </div>
                        <select
                          {...registerProfile('superiorId')}
                          disabled={isProjectHead}
                          className={`input pl-10 ${isProjectHead ? 'bg-gray-50 cursor-not-allowed opacity-50' : ''}`}
                        >
                          <option value="">
                            {isProjectHead ? 'Project Heads do not report to anyone' : 'Select Superior (optional)'}
                          </option>
                          {!isProjectHead && superiorsData?.map(superior => (
                            <option key={superior.id} value={superior.id}>
                              {superior.firstName} {superior.lastName} ({superior.department || 'No Dept'})
                            </option>
                          ))}
                        </select>
                      </div>
                      {!isProjectHead && !user?.organization && (
                        <p className="mt-1 text-xs text-gray-500 italic">Set organization first to see available superiors</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Project Head Status</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Enable this if you are the project head. You will have full task assignment privileges and won't report to anyone.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...registerProfile('isProjectHead')}
                        className="sr-only peer" 
                        onChange={(e) => {
                           const checked = e.target.checked;
                           registerProfile('isProjectHead').onChange(e);
                           if (checked) {
                             setValue('superiorId', '');
                           }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isLoading}
                      className="btn-primary btn-md"
                    >
                      {updateProfileMutation.isLoading && (
                        <LoadingSpinner size="sm" className="mr-2" />
                      )}
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...registerPassword('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...registerPassword('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...registerPassword('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updatePasswordMutation.isLoading}
                      className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {updatePasswordMutation.isLoading && (
                        <LoadingSpinner size="sm" className="mr-2" />
                      )}
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                  <p className="text-sm text-gray-600">Choose how you want to be notified</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive task reminders via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-500">Receive urgent task reminders via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">WhatsApp Notifications</h4>
                      <p className="text-sm text-gray-500">Receive task updates via WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Application Preferences</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customize your TaskFlow Pro experience</p>
                </div>

                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div className="glass-card">
                    <div className="flex items-center space-x-3 mb-4">
                      <Palette className="w-5 h-5 text-blue-500" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Theme</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose your preferred theme for the application
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', description: 'Clean and bright interface' },
                        { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
                        { value: 'system', label: 'System', description: 'Matches your device' },
                      ].map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value as any)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                            theme === themeOption.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                              {themeOption.label}
                            </h5>
                            {theme === themeOption.value && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {themeOption.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other Preferences */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time Zone
                      </label>
                      <select className="input w-full">
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Format
                      </label>
                      <select className="input w-full">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select className="input w-full">
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Tab */}
            {activeTab === 'workflow' && (
              <WorkflowTabContent />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function WorkflowTabContent() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [rules, setRules] = useState<any[]>([])

  const { data: subordinates } = useQuery(
    'subordinates',
    () => usersApi.getSubordinates(),
    { staleTime: 60000 }
  )

  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery(
    'myWorkflow',
    () => workflowsApi.getMyTeamWorkflow(),
    {
      staleTime: 60000,
      onSuccess: (data) => {
        if (data?.rules) {
          setRules(data.rules)
        }
      }
    }
  )

  const updateWorkflowMutation = useMutation(
    (newRules: any[]) => workflowsApi.updateWorkflow(newRules),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myWorkflow')
        toast.success('Workflow rules updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update workflow')
      }
    }
  )

  const handleRuleChange = (subordinateId: string, allowedAssigneeIds: string[]) => {
    setRules(prev => {
      const existingIdx = prev.findIndex(r => r.subordinateId === subordinateId)
      if (existingIdx >= 0) {
        const newRules = [...prev]
        newRules[existingIdx] = { ...newRules[existingIdx], allowedAssigneeIds }
        return newRules
      } else {
        return [...prev, { subordinateId, allowedAssigneeIds }]
      }
    })
  }

  if (isLoadingWorkflow) return <div className="flex justify-center p-8"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-blue-500" />
          Team Assignment Workflow
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define who your direct reports can assign tasks to. By default, they can assign to any direct report or peer.
        </p>
      </div>

      {!subordinates || subordinates.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-500 italic">No direct reports found. Users must set you as their Superior in their profile settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subordinates.map(sub => {
            const rule = rules.find(r => r.subordinateId === sub.id)
            const allowedIds = rule?.allowedAssigneeIds || ['*']
            
            return (
              <div key={sub.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{sub.firstName} {sub.lastName}</div>
                  <div className="text-xs text-gray-500">{sub.department || 'No Department'}</div>
                </div>
                
                <div className="flex-1 max-w-xs">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Can Assign Tasks to:</label>
                  <select 
                    value={allowedIds.includes('*') ? '*' : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === '*') handleRuleChange(sub.id, ['*'])
                      else handleRuleChange(sub.id, [])
                    }}
                    className="input py-1 text-sm"
                  >
                    <option value="*">All Team Members (Subordinates & Peers)</option>
                    <option value="custom">Restricted Team Members</option>
                  </select>
                </div>

                {allowedIds[0] !== '*' && (
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {subordinates.filter(s => s.id !== sub.id).map(otherSub => (
                        <button
                          key={otherSub.id}
                          onClick={() => {
                            const newIds = allowedIds.includes(otherSub.id)
                              ? allowedIds.filter(id => id !== otherSub.id)
                              : [...allowedIds, otherSub.id]
                            handleRuleChange(sub.id, newIds)
                          }}
                          className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                            allowedIds.includes(otherSub.id)
                              ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300'
                              : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {otherSub.firstName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => updateWorkflowMutation.mutate(rules)}
              disabled={updateWorkflowMutation.isLoading}
              className="btn-primary"
            >
              {updateWorkflowMutation.isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Workflow Rules
            </button>
          </div>
        </div>
      )}
    </div>
  )
}