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
        const task = event.task || {}
        const taskStatus = task.status || event.status
        const taskStartDate = task.startDate || event.startDate
        const taskDueDate = task.dueDate || event.dueDate
        const taskCompletedAt = task.completedAt || event.completedAt

        if (!isValidDate(taskStartDate)) return null

        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const today = new Date()

        const start = new Date(taskStartDate)
        const plannedEndStr = taskDueDate || task.startDate || event.startDate
        const plannedEnd = isValidDate(plannedEndStr) ? new Date(plannedEndStr) : start
        
        const isCompleted = taskStatus === 'COMPLETED'
        const completedAt = taskCompletedAt ? new Date(taskCompletedAt) : null
        
        // Actual end is when it was finished, or "today" if still pending
        // Use plannedEnd as fallback if completedAt is missing for finished tasks
        const actualEnd = isCompleted 
            ? (isValidDate(completedAt) ? completedAt : plannedEnd) 
            : today

        // If the entire task is outside this month, skip it
        const maxEnd = (isValidDate(actualEnd) && actualEnd > plannedEnd) ? actualEnd : plannedEnd
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)
        
        if (start > monthEnd || (isValidDate(maxEnd) && maxEnd < monthStart)) return null

        const getGridRange = (s: Date, e: Date) => {
            if (!isValidDate(s) || !isValidDate(e)) return null
            if (s > monthEnd || e < monthStart) return null
            
            // Limit the start and end to the current month's boundaries
            const effectiveStart = s < monthStart ? monthStart : s
            const effectiveEnd = e > monthEnd ? monthEnd : e
            
            const startDay = effectiveStart.getDate()
            const endDay = effectiveEnd.getDate()
            
            if (isNaN(startDay) || isNaN(endDay)) return null

            const span = Math.max(1, endDay - startDay + 1)
            return `${startDay} / span ${span}`
        }

        // 1. On-Time actual: From start to min(actualEnd, plannedEnd)
        const onTimeEnd = (isValidDate(actualEnd) && actualEnd < plannedEnd) ? actualEnd : plannedEnd
        
        // 2. Delay actual: From plannedEnd + 1 to actualEnd
        let delayRange = null
        if (isValidDate(actualEnd) && actualEnd > plannedEnd) {
            const delayStart = new Date(plannedEnd)
            delayStart.setDate(delayStart.getDate() + 1)
            delayRange = getGridRange(delayStart, actualEnd)
        }

        return {
            planned: getGridRange(start, plannedEnd),
            actualOnTime: getGridRange(start, onTimeEnd),
            actualFull: getGridRange(start, actualEnd),
            actualDelay: delayRange,
            isCompleted,
            isLate: isValidDate(actualEnd) && actualEnd > plannedEnd
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

                                            {/* 2. Actual Progress Bar (Thicker/Bottom) */}
                                            <div className="absolute inset-x-0 bottom-4 grid items-center pointer-events-none" style={gridStyle}>
                                                {pos.isCompleted ? (
                                                    // Completed: Solid Green Bar (from start to actualEnd)
                                                    <Link
                                                        href={`/tasks/${id}`}
                                                        style={{ gridColumn: pos.actualFull ?? undefined }}
                                                        className="h-5 flex items-center px-3 rounded-full text-[9px] text-white font-medium shadow-sm transition-all hover:scale-[1.01] hover:shadow-md pointer-events-auto z-10 truncate bg-emerald-500"
                                                    >
                                                        <span className="truncate">{event.title}</span>
                                                        <span className="ml-1 shrink-0">✓</span>
                                                    </Link>
                                                ) : (
                                                    // Pending: Split Orange/Red Bar
                                                    <>
                                                        {pos.actualOnTime && (
                                                            <Link
                                                                href={`/tasks/${id}`}
                                                                style={{ gridColumn: pos.actualOnTime }}
                                                                className={`h-5 flex items-center px-3 ${pos.actualDelay ? 'rounded-l-full' : 'rounded-full'} text-[9px] text-white font-medium shadow-sm transition-all hover:scale-[1.01] hover:shadow-md pointer-events-auto z-10 truncate bg-orange-500`}
                                                            >
                                                                <span className="truncate">{event.title}</span>
                                                            </Link>
                                                        )}
                                                        {pos.actualDelay && (
                                                            <Link
                                                                href={`/tasks/${id}`}
                                                                style={{ gridColumn: pos.actualDelay }}
                                                                className={`h-5 flex items-center px-3 rounded-r-full ${!pos.actualOnTime ? 'rounded-l-full' : ''} text-[9px] text-white font-medium shadow-sm transition-all hover:scale-[1.01] hover:shadow-md pointer-events-auto z-10 truncate bg-rose-600`}
                                                            >
                                                                {!pos.actualOnTime && <span className="truncate">{event.title}</span>}
                                                                <AlertCircle className="w-3 h-3 ml-auto animate-pulse" />
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </div>
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
                <div className="flex items-center"><span className="w-4 h-3 rounded-full bg-orange-500 mr-1"></span> On-Track Progress</div>
                <div className="flex items-center"><span className="w-4 h-3 rounded-full bg-rose-600 mr-1"></span> Overdue Progress</div>
                <div className="flex items-center"><span className="w-4 h-3 rounded-full bg-emerald-500 mr-1"></span> Completed</div>
            </div>
        </div>
    )
}
