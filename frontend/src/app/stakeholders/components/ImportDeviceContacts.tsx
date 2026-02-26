'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { toast } from 'react-hot-toast'

interface ImportDeviceContactsProps {
    onImportSuccess: () => void
}

export function ImportDeviceContacts({ onImportSuccess }: ImportDeviceContactsProps) {
    const [isSupported, setIsSupported] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    useEffect(() => {
        // Check if Contact Picker API is supported
        setIsSupported('contacts' in navigator && 'ContactsManager' in window)
    }, [])

    const handleImport = async () => {
        if (!isSupported) return

        try {
            const props = ['name', 'email', 'tel']
            const opts = { multiple: true }

            // @ts-ignore - Contact Picker API is still experimental in TS
            const contacts = await navigator.contacts.select(props, opts)

            if (!contacts || contacts.length === 0) return

            setIsImporting(true)

            const stakeholdersToCreate = contacts.map((contact: any) => {
                const name = contact.name?.[0] || 'Unknown'
                const parts = name.split(' ')
                const firstName = parts[0] || 'Unknown'
                const lastName = parts.slice(1).join(' ') || ' '

                return {
                    firstName,
                    lastName,
                    email: contact.email?.[0] || undefined,
                    phone: contact.tel?.[0]?.replace(/\s/g, '') || undefined,
                    tags: ['imported-mobile']
                }
            })

            await stakeholdersApi.createBulkStakeholders(stakeholdersToCreate)

            toast.success(`Successfully imported ${contacts.length} contacts`)
            onImportSuccess()
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Contact import failed:', err)
                toast.error('Failed to import contacts from device')
            }
        } finally {
            setIsImporting(false)
        }
    }

    if (!isSupported) return null

    return (
        <button
            onClick={handleImport}
            disabled={isImporting}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base disabled:opacity-50"
        >
            {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            Import from Device
        </button>
    )
}
