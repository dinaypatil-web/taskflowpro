'use client'

import React from 'react'
import Link from 'next/link'
import { getPriorityColor, getPrioritySolidColor, isValidDate } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface GanttChartProps {
    currentDate: Date
    events: any[]
}

export function GanttChart({ currentDate, events }: GanttChartProps) {
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const lastDay = new Date(year, month + 1, 0)
        return lastDay.getDate()
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    // Group events by task to ensure one row per task
    const taskEvents = events.filter((v, i, a) => a.findIndex(t => (t.taskId || t.id) === (v.taskId || v.id)) === i)

    const getTaskPosition = (event: any) => {
        if (!isValidDate(event.startDate)) return null

        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)

        const start = new Date(event.startDate)
        const endDateVal = event.endDate || event.dueDate || event.startDate
        const end = new Date(endDateVal)

        // Calculate start percentage
        const startOffset = Math.max(0, (start.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
        const startPercent = (Math.min(daysInMonth, startOffset) / daysInMonth) * 100

        // Calculate width percentage
        const clampedStart = new Date(Math.max(monthStart.getTime(), start.getTime()))
        const clampedEnd = new Date(Math.min(monthEnd.getTime(), end.getTime()))
        const duration = Math.max(1, (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24) + 1)
        const widthPercent = (Math.min(daysInMonth - startOffset, duration) / daysInMonth) * 100

        if (start > monthEnd || end < monthStart) return null

        return { left: `${startPercent}%`, width: `${widthPercent}%` }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header Row - Days */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <div className="w-48 flex-shrink-0 p-4 font-semibold text-gray-700 border-r border-gray-100">Task</div>
                        <div className="flex-1 flex">
                            {days.map((day) => {
                                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                                const isToday = new Date().toDateString() === date.toDateString()
                                return (
                                    <div
                                        key={day}
                                        className={`flex-1 text-center py-2 border-r border-gray-100 last:border-r-0 min-w-[30px] ${isToday ? 'bg-primary-50 text-primary-600 font-bold' : 'text-gray-500'
                                            }`}
                                    >
                                        <div className="text-[10px] uppercase">{dayNames[date.getDay()]}</div>
                                        <div className="text-xs">{day}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Task Rows */}
                    <div className="divide-y divide-gray-50">
                        {taskEvents.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 italic">No tasks scheduled for this month</div>
                        ) : (
                            taskEvents.map((event) => {
                                const pos = getTaskPosition(event)
                                const taskPayload = event.task || event
                                const id = event.taskId || event.id

                                return (
                                    <div key={event.id} className="flex group hover:bg-gray-50/50 transition-colors">
                                        <div className="w-48 flex-shrink-0 p-3 border-r border-gray-100 truncate flex items-center">
                                            <Link
                                                href={`/tasks/${id}`}
                                                className="text-xs font-medium text-gray-700 hover:text-primary-600 truncate transition-colors"
                                                title={event.title}
                                            >
                                                {event.title}
                                            </Link>
                                        </div>
                                        <div className="flex-1 relative h-12 flex items-center">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 flex">
                                                {days.map((day) => (
                                                    <div key={day} className="flex-1 border-r border-gray-50 last:border-r-0" />
                                                ))}
                                            </div>

                                            {/* Task Bar */}
                                            {pos && (
                                                <Link
                                                    href={`/tasks/${id}`}
                                                    style={{ left: pos.left, width: pos.width }}
                                                    className={`absolute h-6 flex items-center px-2 rounded-full text-[10px] text-white font-medium shadow-sm transition-all hover:scale-[1.02] hover:shadow-md z-10 truncate ${getPrioritySolidColor(taskPayload.priority)}`}
                                                >
                                                    <span className="truncate">{event.title}</span>
                                                    {event.status === 'COMPLETED' && <span className="ml-1">✓</span>}
                                                    {new Date(event.dueDate) < new Date() && event.status !== 'COMPLETED' && (
                                                        <AlertCircle className="w-3 h-3 ml-1 flex-shrink-0" />
                                                    )}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-4 text-[10px] text-gray-500">
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Urgent</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span> High</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Medium</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Low</div>
            </div>
        </div>
    )
}
