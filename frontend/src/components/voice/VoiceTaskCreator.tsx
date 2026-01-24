'use client'

import { useState } from 'react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { useMutation, useQueryClient } from 'react-query'
import { tasksApi } from '@/lib/api/tasks'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Mic, MicOff, Check, X, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface VoiceTaskCreatorProps {
  onTaskCreated?: (task: any) => void
  onClose?: () => void
}

export function VoiceTaskCreator({ onTaskCreated, onClose }: VoiceTaskCreatorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedPriority, setEditedPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [editedDueDate, setEditedDueDate] = useState('')
  
  const queryClient = useQueryClient()
  
  const {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    processVoiceCommand,
  } = useVoiceRecognition()

  const createTaskMutation = useMutation(tasksApi.createVoiceTask, {
    onSuccess: (task) => {
      toast.success('Task created successfully!')
      queryClient.invalidateQueries('tasks')
      onTaskCreated?.(task)
      resetTranscript()
      onClose?.()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create task')
    },
  })

  const handleStartRecording = () => {
    if (!isSupported) {
      toast.error('Voice recognition is not supported in this browser')
      return
    }
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
  }

  const handleCreateTask = async () => {
    if (!transcript.trim()) {
      toast.error('Please record a voice command first')
      return
    }

    try {
      const parsedCommand = await processVoiceCommand(transcript, confidence)
      
      const taskData = {
        title: isEditing ? editedTitle : parsedCommand.title,
        priority: isEditing ? editedPriority : parsedCommand.priority,
        dueDate: isEditing ? editedDueDate : parsedCommand.dueDate,
        voiceMetadata: parsedCommand.voiceMetadata,
      }

      createTaskMutation.mutate(taskData)
    } catch (error) {
      toast.error('Failed to process voice command')
    }
  }

  const handleEdit = async () => {
    if (!transcript.trim()) return
    
    const parsedCommand = await processVoiceCommand(transcript, confidence)
    setEditedTitle(parsedCommand.title)
    setEditedPriority(parsedCommand.priority)
    setEditedDueDate(parsedCommand.dueDate || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedTitle('')
    setEditedPriority('MEDIUM')
    setEditedDueDate('')
  }

  if (!isSupported) {
    return (
      <div className="card p-6 text-center">
        <div className="text-gray-500 mb-4">
          <MicOff className="h-12 w-12 mx-auto mb-2" />
          <p>Voice recognition is not supported in this browser.</p>
          <p className="text-sm mt-2">
            Please use Chrome, Edge, or Safari for voice features.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Create Task with Voice</h3>
        <p className="text-gray-600 text-sm">
          Click the microphone and speak your task. Try: "Create a high priority task to finish the report by tomorrow"
        </p>
      </div>

      {/* Voice Recording Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={isListening ? handleStopRecording : handleStartRecording}
          disabled={createTaskMutation.isLoading}
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200',
            isListening
              ? 'bg-red-500 hover:bg-red-600 voice-recording'
              : 'bg-primary-500 hover:bg-primary-600',
            'text-white shadow-lg'
          )}
        >
          {isListening ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
      </div>

      {/* Recording Status */}
      {isListening && (
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording...</span>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Voice Command</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  Confidence: {Math.round(confidence * 100)}%
                </span>
                <button
                  onClick={handleEdit}
                  className="text-gray-400 hover:text-gray-600"
                  title="Edit task details"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-700">{transcript}</p>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Edit Task Details</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="input w-full"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as any)}
                    className="input w-full"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={handleCancelEdit}
                  className="btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-primary btn-sm"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                resetTranscript()
                handleCancelEdit()
              }}
              className="btn-outline btn-md flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
            
            <button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isLoading}
              className="btn-primary btn-md flex items-center space-x-2"
            >
              {createTaskMutation.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Create Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!transcript && !isListening && (
        <div className="text-center text-gray-500">
          <p className="text-sm mb-2">Click the microphone to start recording</p>
          <div className="text-xs space-y-1">
            <p><strong>Examples:</strong></p>
            <p>"Create a high priority task to review the contract"</p>
            <p>"Add urgent task to call client by tomorrow"</p>
            <p>"Make a task to prepare presentation for next week"</p>
          </div>
        </div>
      )}
    </div>
  )
}