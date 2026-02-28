'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, Check, X, User } from 'lucide-react'
import { stakeholdersApi } from '@/lib/api/stakeholders'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface ImportDeviceContactsProps {
    onImportSuccess: () => void
}

interface DeviceContact {
    name: string[]
    email: string[]
    tel: string[]
}

interface ParsedContact {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    selected: boolean
}

export function ImportDeviceContacts({ onImportSuccess }: ImportDeviceContactsProps) {
    const [isSupported, setIsSupported] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [isPicking, setIsPicking] = useState(false)
    const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([])
    const [showReview, setShowReview] = useState(false)

    useEffect(() => {
        setIsSupported('contacts' in navigator && 'ContactsManager' in window)
    }, [])

    const parseName = (nameArray: string[]) => {
        const fullString = nameArray?.[0] || 'Unknown'
        const parts = fullString.trim().split(/\s+/)
        if (parts.length === 1) return { first: parts[0], last: '' }

        // Handle "John Van Doe" -> First: John, Last: Van Doe
        return {
            first: parts[0],
            last: parts.slice(1).join(' ')
        }
    }

    const handlePickContacts = async () => {
        if (!isSupported) return

        try {
            const props = ['name', 'email', 'tel']
            const opts = { multiple: true }

            // @ts-ignore
            const contacts: DeviceContact[] = await navigator.contacts.select(props, opts)

            if (!contacts || contacts.length === 0) return

            const parsed = contacts.map((c, index) => {
                const { first, last } = parseName(c.name)
                return {
                    id: `contact-${index}-${Date.now()}`,
                    firstName: first,
                    lastName: last,
                    email: c.email?.[0] || undefined,
                    phone: c.tel?.[0]?.replace(/\s/g, '') || undefined,
                    selected: true
                }
            })

            setParsedContacts(parsed)
            setShowReview(true)
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Contact pick failed:', err)
                toast.error('Failed to access device contacts')
            }
        }
    }

    const toggleSelection = (id: string) => {
        setParsedContacts(prev => prev.map(c =>
            c.id === id ? { ...c, selected: !c.selected } : c
        ))
    }

    const confirmImport = async () => {
        const selected = parsedContacts.filter(c => c.selected)
        if (selected.length === 0) {
            setShowReview(false)
            return
        }

        setIsImporting(true)
        try {
            const stakeholdersToCreate = selected.map(c => ({
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                tags: ['imported-mobile']
            }))

            await stakeholdersApi.createBulkStakeholders(stakeholdersToCreate)
            toast.success(`Successfully synced ${selected.length} contacts`)
            onImportSuccess()
            setShowReview(false)
        } catch (err) {
            console.error('Import failed:', err)
            toast.error('Failed to sync contacts to database')
        } finally {
            setIsImporting(false)
        }
    }

    if (!isSupported) return null

    return (
        <>
            <button
                onClick={handlePickContacts}
                disabled={isImporting}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base disabled:opacity-50"
            >
                {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Download className="h-4 w-4 mr-2" />
                )}
                Import Contacts
            </button>

            {/* Review Modal */}
            {showReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Review Contacts</h2>
                            <p className="text-sm text-gray-500 mt-1">Select the contacts you want to add or update.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {parsedContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    onClick={() => toggleSelection(contact.id)}
                                    className={clsx(
                                        "flex items-center p-3 rounded-xl cursor-pointer transition-all border-2",
                                        contact.selected
                                            ? "bg-primary-50 border-primary-200"
                                            : "hover:bg-gray-50 border-transparent"
                                    )}
                                >
                                    <div className={clsx(
                                        "h-10 w-10 rounded-full flex items-center justify-center mr-4",
                                        contact.selected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"
                                    )}>
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {contact.firstName} {contact.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {contact.email || contact.phone || 'No contact info'}
                                        </p>
                                    </div>
                                    <div className={clsx(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        contact.selected
                                            ? "bg-primary-500 border-primary-500"
                                            : "border-gray-200"
                                    )}>
                                        {contact.selected && <Check className="h-4 w-4 text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex items-center gap-3">
                            <button
                                onClick={() => setShowReview(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmImport}
                                disabled={isImporting || parsedContacts.every(c => !c.selected)}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Sync {parsedContacts.filter(c => c.selected).length} Contacts
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
