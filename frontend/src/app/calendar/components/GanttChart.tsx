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
        const today = new Date()

        const start = new Date(event.startDate)
        const plannedEnd = new Date(event.dueDate || event.endDate || event.startDate)
        
        const isCompleted = event.status === 'COMPLETED'
        const completedAt = event.completedAt ? new Date(event.completedAt) : null
        
        // Actual end is when it was finished, or "today" if still pending
        const actualEnd = isCompleted ? (completedAt || plannedEnd) : today

        // If the entire task is outside this month, skip it
        const maxEnd = actualEnd > plannedEnd ? actualEnd : plannedEnd
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)
        
        if (start > monthEnd || maxEnd < monthStart) return null

        const getLocalDay = (d: Date) => {
            const dYear = d.getFullYear()
            const dMonth = d.getMonth()
            if (dYear < year || (dYear === year && dMonth < month)) return 1
            if (dYear > year || (dYear === year && dMonth > month)) return daysInMonth
            return d.getDate()
        }

        // Helper to calculate grid column based on date range
        const getGridRange = (s: Date, e: Date) => {
            if (s > monthEnd || e < monthStart) return null
            const startDay = getLocalDay(s)
            const endDay = getLocalDay(e)
            const span = Math.max(1, endDay - startDay + 1)
            return `${startDay} / span ${span}`
        }

        return {
            planned: getGridRange(start, plannedEnd),
            actual: getGridRange(start, actualEnd),
            isLate: actualEnd > plannedEnd,
            isCompleted
        }
    }

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${daysInMonth}, minmax(32px, 1fr))`
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header Row - Days */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <div className="w-48 flex-shrink-0 p-4 font-semibold text-gray-700 border-r border-gray-100">Task</div>
                        <div className="flex-1" style={gridStyle}>
                            {days.map((day) => {
                                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                                const isToday = new Date().toDateString() === date.toDateString()
                                return (
                                    <div
                                        key={day}
                                        className={`text-center py-2 border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-primary-50 text-primary-600 font-bold' : 'text-gray-500'
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
                                if (!pos) return null
                                
                                const taskPayload = event.task || event
                                const id = event.taskId || event.id

                                return (
                                    <div key={event.id} className="flex group hover:bg-gray-50/50 transition-colors">
                                        <div className="w-48 flex-shrink-0 p-4 border-r border-gray-100 truncate flex items-center">
                                            <Link
                                                href={`/tasks/${id}`}
                                                className="text-xs font-medium text-gray-700 hover:text-primary-600 truncate transition-colors"
                                                title={event.title}
                                            >
                                                {event.title}
                                            </Link>
                                        </div>
                                        <div className="flex-1 relative h-16 group" style={gridStyle}>
                                            {/* Grid Lines */}
                                            {days.map((day) => (
                                                <div key={day} className="border-r border-gray-100 last:border-r-0 h-full" />
                                            ))}

                                            {/* 1. Planned Bar (Thin/Top) */}
                                            {pos.planned && (
                                                <div className="absolute inset-x-0 top-3 grid items-center pointer-events-none" style={gridStyle}>
                                                    <div
                                                        style={{ gridColumn: pos.planned }}
                                                        className="h-2 bg-indigo-100/50 border border-indigo-200/50 rounded-full z-0"
                                                        title="Planned Schedule"
                                                    />
                                                </div>
                                            )}

                                            {/* 2. Actual Bar (Thick/Bottom) */}
                                            {pos.actual && (
                                                <div className="absolute inset-x-0 bottom-4 grid items-center pointer-events-none" style={gridStyle}>
                                                    <Link
                                                        href={`/tasks/${id}`}
                                                        style={{ gridColumn: pos.actual }}
                                                        className={`h-5 flex items-center px-3 rounded-full text-[9px] text-white font-medium shadow-sm transition-all hover:scale-[1.01] hover:shadow-md pointer-events-auto z-10 truncate ${pos.isLate && !pos.isCompleted ? 'bg-rose-600' : (pos.isCompleted ? 'bg-emerald-500' : getPrioritySolidColor(taskPayload.priority))}`}
                                                    >
                                                        <span className="truncate">{event.title}</span>
                                                        {pos.isCompleted && <span className="ml-1">✓</span>}
                                                    </Link>
                                                </div>
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
                <div className="flex items-center"><span className="w-4 h-2 bg-indigo-100 border border-indigo-200 rounded-full mr-1"></span> Planned</div>
                <div className="flex items-center"><span className="w-4 h-3 rounded-full bg-rose-600 mr-1 animate-pulse"></span> Overdue (Actual)</div>
                <div className="flex items-center"><span className="w-4 h-3 rounded-full bg-primary-600 mr-1"></span> Progress (Actual)</div>
                <div className="flex items-center"><span className="w-4 h-3 rounded-full bg-emerald-500 mr-1"></span> Completed</div>
            </div>
        </div>
    )
}
