'use client'

import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

export interface DeviceContact {
  name?: string[]
  tel?: string[]
  email?: string[]
  org?: string[]
}

export interface ParsedContact {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  organization?: string
}

export const useContacts = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if Contacts API is supported
  const checkSupport = useCallback(() => {
    const supported = 'contacts' in navigator && 'ContactsManager' in window
    setIsSupported(supported)
    return supported
  }, [])

  // Check support on mount
  useEffect(() => {
    checkSupport()
  }, [checkSupport])

  // Import contacts from device
  const importContacts = useCallback(async (): Promise<ParsedContact[]> => {
    if (!isSupported) {
      toast.error('Contact access is not supported on this device')
      return []
    }

    try {
      setIsLoading(true)
      
      // Request contacts with specific properties
      const contacts = await (navigator as any).contacts.select([
        'name',
        'tel',
        'email',
        'org'
      ], { multiple: true })

      const parsedContacts: ParsedContact[] = contacts.map((contact: DeviceContact) => {
        const fullName = contact.name?.[0] || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        return {
          firstName,
          lastName,
          phone: contact.tel?.[0],
          email: contact.email?.[0],
          organization: contact.org?.[0],
        }
      }).filter((contact: ParsedContact) => contact.firstName || contact.lastName)

      toast.success(`Imported ${parsedContacts.length} contacts`)
      return parsedContacts
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Contact access was denied. Please allow access to import contacts.')
      } else {
        toast.error('Failed to import contacts. Please try again.')
      }
      console.error('Contact import error:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Save stakeholder to device contacts
  const saveToContacts = useCallback(async (stakeholder: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
    organization?: string
  }): Promise<boolean> => {
    if (!isSupported) {
      // Fallback: Generate vCard for manual save
      generateVCard(stakeholder)
      return false
    }

    try {
      setIsLoading(true)

      // Create contact object
      const contactData: any = {
        name: [`${stakeholder.firstName} ${stakeholder.lastName}`.trim()],
      }

      if (stakeholder.phone) {
        contactData.tel = [stakeholder.phone]
      }

      if (stakeholder.email) {
        contactData.email = [stakeholder.email]
      }

      if (stakeholder.organization) {
        contactData.org = [stakeholder.organization]
      }

      // Save contact (Note: This is experimental and may not work on all devices)
      // For now, we'll use the vCard fallback
      generateVCard(stakeholder)
      toast.success('Contact information prepared for saving')
      return true
    } catch (error) {
      console.error('Save contact error:', error)
      // Fallback to vCard
      generateVCard(stakeholder)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Generate vCard for manual save (fallback method)
  const generateVCard = useCallback((stakeholder: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
    organization?: string
  }) => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${stakeholder.firstName} ${stakeholder.lastName}`,
      `N:${stakeholder.lastName};${stakeholder.firstName};;;`,
      stakeholder.phone ? `TEL:${stakeholder.phone}` : '',
      stakeholder.email ? `EMAIL:${stakeholder.email}` : '',
      stakeholder.organization ? `ORG:${stakeholder.organization}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n')

    // Create downloadable vCard file
    const blob = new Blob([vCard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${stakeholder.firstName}_${stakeholder.lastName}.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Contact file downloaded. Add it to your contacts app.')
  }, [])

  // Import single contact
  const importSingleContact = useCallback(async (): Promise<ParsedContact | null> => {
    if (!isSupported) {
      toast.error('Contact access is not supported on this device')
      return null
    }

    try {
      setIsLoading(true)
      
      const contacts = await (navigator as any).contacts.select([
        'name',
        'tel',
        'email',
        'org'
      ], { multiple: false })

      if (contacts.length === 0) {
        return null
      }

      const contact = contacts[0]
      const fullName = contact.name?.[0] || ''
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const parsedContact: ParsedContact = {
        firstName,
        lastName,
        phone: contact.tel?.[0],
        email: contact.email?.[0],
        organization: contact.org?.[0],
      }

      toast.success('Contact imported successfully')
      return parsedContact
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Contact access was denied')
      } else {
        toast.error('Failed to import contact')
      }
      console.error('Single contact import error:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return {
    isSupported,
    isLoading,
    importContacts,
    importSingleContact,
    saveToContacts,
    generateVCard,
    checkSupport,
  }
}