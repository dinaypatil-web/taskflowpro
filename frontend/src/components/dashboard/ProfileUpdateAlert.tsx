'use client'

import React from 'react'
import Link from 'next/link'
import { Info, ArrowRight, Building2, UserCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export const ProfileUpdateAlert = () => {
  const { user } = useAuthStore()

  // Only show if essential organizational details are missing
  const isProfileIncomplete = !user?.organization || !user?.projectName || !user?.department

  if (!isProfileIncomplete) return null

  return (
    <div className="relative overflow-hidden glass-card-premium border-l-4 border-blue-500 animate-fade-in-up">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Building2 className="w-24 h-24" />
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <UserCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Complete Your Professional Profile
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your Organization, Project, and Team details to enable the new <span className="font-semibold text-blue-600 dark:text-blue-400">Hierarchical Task Assignment</span> feature.
            </p>
          </div>
        </div>
        
        <Link 
          href="/settings" 
          className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
        >
          <span>Update Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
