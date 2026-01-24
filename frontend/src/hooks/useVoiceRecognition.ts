'use client'

import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  grammars: SpeechGrammarList
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface SpeechGrammarList {
  readonly length: number
  item(index: number): SpeechGrammar
  addFromURI(src: string, weight?: number): void
  addFromString(string: string, weight?: number): void
}

interface SpeechGrammar {
  src: string
  weight: number
}

interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

interface VoiceMetadata {
  originalTranscript: string
  confidence: number
  language: string
  processingTime: number
}

interface UseVoiceRecognitionReturn {
  isListening: boolean
  transcript: string
  confidence: number
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  processVoiceCommand: (transcript: string, confidence: number) => Promise<any>
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [isSupported, setIsSupported] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const startTimeRef = useRef<number>(0)

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') return false

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setIsSupported(false)
      return false
    }

    setIsSupported(true)
    
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      startTimeRef.current = Date.now()
      toast.success('Voice recognition started')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptPart = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcriptPart
          setConfidence(result[0].confidence)
        } else {
          interimTranscript += transcriptPart
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      switch (event.error) {
        case 'no-speech':
          toast.error('No speech detected. Please try again.')
          break
        case 'audio-capture':
          toast.error('Microphone not accessible. Please check permissions.')
          break
        case 'not-allowed':
          toast.error('Microphone permission denied.')
          break
        case 'network':
          toast.error('Network error. Please check your connection.')
          break
        default:
          toast.error('Speech recognition error. Please try again.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    return true
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current && !initializeRecognition()) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('')
      setConfidence(0)
      recognitionRef.current.start()
    }
  }, [isListening, initializeRecognition])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
  }, [])

  const processVoiceCommand = useCallback(async (transcript: string, confidence: number) => {
    const processingTime = Date.now() - startTimeRef.current
    
    const voiceMetadata: VoiceMetadata = {
      originalTranscript: transcript,
      confidence,
      language: 'en-US',
      processingTime,
    }

    // Parse voice command using natural language processing
    const parsedCommand = parseVoiceCommand(transcript)
    
    return {
      ...parsedCommand,
      voiceMetadata,
    }
  }, [])

  return {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    processVoiceCommand,
  }
}

// Natural language processing for voice commands
function parseVoiceCommand(transcript: string) {
  const text = transcript.toLowerCase().trim()
  
  // Extract task title (everything before priority/date keywords)
  let title = text
  const priorityMatch = text.match(/(low|medium|high|urgent)\s+priority/i)
  const dateMatch = text.match(/(due|by|on|for)\s+(today|tomorrow|next\s+week|next\s+month|\d{1,2}\/\d{1,2}|\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december))/i)
  
  // Extract priority
  let priority = 'MEDIUM'
  if (text.includes('low priority') || text.includes('not urgent')) {
    priority = 'LOW'
  } else if (text.includes('high priority') || text.includes('important')) {
    priority = 'HIGH'
  } else if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
    priority = 'URGENT'
  }

  // Extract due date
  let dueDate: string | undefined
  if (text.includes('today')) {
    dueDate = new Date().toISOString()
  } else if (text.includes('tomorrow')) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    dueDate = tomorrow.toISOString()
  } else if (text.includes('next week')) {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    dueDate = nextWeek.toISOString()
  } else if (text.includes('next month')) {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    dueDate = nextMonth.toISOString()
  }

  // Clean up title by removing priority and date keywords
  title = title
    .replace(/(low|medium|high|urgent)\s+priority/gi, '')
    .replace(/(due|by|on|for)\s+(today|tomorrow|next\s+week|next\s+month)/gi, '')
    .replace(/create\s+(a\s+)?(task\s+)?(to\s+)?/gi, '')
    .replace(/add\s+(a\s+)?(task\s+)?(to\s+)?/gi, '')
    .replace(/make\s+(a\s+)?(task\s+)?(to\s+)?/gi, '')
    .trim()

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1)

  return {
    title: title || 'New Task',
    priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}