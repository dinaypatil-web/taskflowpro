'use client'

import { useState } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Download, 
  Smartphone, 
  Check, 
  AlertCircle,
  FileDown
} from 'lucide-react'

interface SaveToContactsProps {
  stakeholder: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
    organization?: string
  }
  className?: string
}

export function SaveToContacts({ stakeholder, className = '' }: SaveToContactsProps) {
  const { isSupported, isLoading, saveToContacts, generateVCard } = useContacts()
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const success = await saveToContacts(stakeholder)
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleDownloadVCard = () => {
    generateVCard(stakeholder)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) {
    return (
      <button
        disabled
        className={`inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg ${className}`}
      >
        <Check className="h-4 w-4 mr-2" />
        <span className="text-sm">Saved</span>
      </button>
    )
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {isSupported ? (
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Save to device contacts"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Smartphone className="h-4 w-4 mr-2" />
          )}
          <span className="text-sm">Save to Contacts</span>
        </button>
      ) : (
        <button
          onClick={handleDownloadVCard}
          className="inline-flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          title="Download contact file"
        >
          <FileDown className="h-4 w-4 mr-2" />
          <span className="text-sm">Download Contact</span>
        </button>
      )}
      
      <div className="relative group">
        <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {isSupported 
            ? 'Save this stakeholder to your device contacts'
            : 'Download contact file to add to your contacts app'
          }
        </div>
      </div>
    </div>
  )
}