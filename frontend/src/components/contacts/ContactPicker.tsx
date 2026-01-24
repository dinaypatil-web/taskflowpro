'use client'

import { useState } from 'react'
import { useContacts, ParsedContact } from '@/hooks/useContacts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Users, 
  Download, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Building,
  Check,
  X
} from 'lucide-react'

interface ContactPickerProps {
  onContactSelect: (contact: ParsedContact) => void
  onClose: () => void
}

export function ContactPicker({ onContactSelect, onClose }: ContactPickerProps) {
  const { isSupported, isLoading, importContacts, importSingleContact } = useContacts()
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [showContactsList, setShowContactsList] = useState(false)

  const handleImportAll = async () => {
    const importedContacts = await importContacts()
    setContacts(importedContacts)
    setShowContactsList(true)
  }

  const handleImportSingle = async () => {
    const contact = await importSingleContact()
    if (contact) {
      onContactSelect(contact)
      onClose()
    }
  }

  const handleSelectContact = (contact: ParsedContact) => {
    onContactSelect(contact)
    onClose()
  }

  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Contact Access Not Available
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Contact import is not supported on this device or browser. You can still manually enter contact information.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Continue Manually
        </button>
      </div>
    )
  }

  if (showContactsList) {
    return (
      <div className="max-h-96 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Select Contact</h3>
          <button
            onClick={() => setShowContactsList(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No contacts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectContact(contact)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {contact.firstName} {contact.lastName}
                      </h4>
                      <div className="mt-1 space-y-1">
                        {contact.email && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.organization && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Building className="h-3 w-3 mr-1" />
                            <span className="truncate">{contact.organization}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <Users className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Import from Contacts
        </h3>
        <p className="text-sm text-gray-600">
          Import contact information from your device to quickly add stakeholders
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleImportSingle}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <User className="h-4 w-4 mr-2" />
          )}
          Select Single Contact
        </button>

        <button
          onClick={handleImportAll}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Browse All Contacts
        </button>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Enter Manually
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Privacy:</strong> Contact information is only used to populate the form and is not stored without your permission.
        </p>
      </div>
    </div>
  )
}