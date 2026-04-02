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
        const plannedEndVal = event.endDate || event.dueDate || event.startDate
        const plannedEnd = new Date(plannedEndVal)
        
        const isCompleted = event.status === 'COMPLETED'
        const completedAt = event.completedAt ? new Date(event.completedAt) : null
        
        // Actual end is when it was finished, or "today" if still pending
        const actualEnd = isCompleted ? (completedAt || plannedEnd) : today
        const isLate = actualEnd > plannedEnd

        // If the entire task (including actual progress) is outside this month, skip it
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

        // 1. Planned Range (Baseline)
        const pStartDay = getLocalDay(start)
        const pEndDay = getLocalDay(plannedEnd)
        const pSpan = Math.max(1, pEndDay - pStartDay + 1)
        const planned = (start <= monthEnd && plannedEnd >= monthStart) ? {
            gridColumn: `${pStartDay} / span ${pSpan}`
        } : null

        // 2. Actual Progress Range
        let actual = null
        if (plannedEnd >= monthStart) {
            const aStartDay = getLocalDay(start)
            const aEndDay = getLocalDay(isLate ? plannedEnd : actualEnd)
            const aSpan = Math.max(1, aEndDay - aStartDay + 1)
            if (start <= monthEnd && (isLate ? plannedEnd : actualEnd) >= monthStart) {
                actual = {
                    gridColumn: `${aStartDay} / span ${aSpan}`
                }
            }
        }

        // 3. Delay Range (Extension)
        let delay = null
        if (isLate) {
            const delayStart = new Date(plannedEnd)
            delayStart.setDate(delayStart.getDate() + 1)
            
            if (actualEnd >= monthStart && delayStart <= monthEnd) {
                // If plannedEnd was before this month, delay starts at Day 1
                const dStartDay = (plannedEnd < monthStart) ? 1 : getLocalDay(delayStart)
                const dEndDay = getLocalDay(actualEnd)
                const dSpan = Math.max(1, dEndDay - dStartDay + 1)
                delay = {
                    gridColumn: `${dStartDay} / span ${dSpan}`
                }
            }
        }

        return { planned, actual, delay, isCompleted, isLate }
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
                                        <div className="flex-1 relative h-14" style={gridStyle}>
                                            {/* Grid Lines */}
                                            {days.map((day) => (
                                                <div key={day} className="border-r border-gray-100 last:border-r-0 h-full" />
                                            ))}

                                            {/* Planned Baseline (Thin Line) */}
                                            {pos.planned && (
                                                <div 
                                                    className="absolute top-2 h-1 bg-gray-200 rounded-full opacity-60 z-0"
                                                    style={{ gridColumn: pos.planned.gridColumn }}
                                                    title="Planned Schedule"
                                                />
                                            )}

                                            {/* Actual Progress Container */}
                                            <div className="absolute inset-x-0 bottom-3 grid items-center pointer-events-none" style={gridStyle}>
                                                {/* 1. Actual Progress Segment */}
                                                {pos.actual && (
                                                    <Link
                                                        href={`/tasks/${id}`}
                                                        style={{ gridColumn: pos.actual.gridColumn }}
                                                        className={`h-6 flex items-center px-3 ${pos.delay ? 'rounded-l-full border-r border-white/20' : 'rounded-full'} text-[10px] text-white font-medium shadow-sm transition-all hover:scale-[1.02] hover:shadow-md pointer-events-auto z-10 truncate ${pos.isCompleted ? 'bg-gray-400' : getPrioritySolidColor(taskPayload.priority)}`}
                                                    >
                                                        <span className="truncate">{event.title}</span>
                                                        {pos.isCompleted && !pos.delay && <span className="ml-1">✓</span>}
                                                    </Link>
                                                )}

                                                {/* 2. Delay Extension Segment */}
                                                {pos.delay && (
                                                    <Link
                                                        href={`/tasks/${id}`}
                                                        style={{ gridColumn: pos.delay.gridColumn }}
                                                        className={`h-6 flex items-center px-3 rounded-r-full text-[10px] text-white font-medium shadow-sm transition-all hover:scale-[1.02] hover:shadow-md pointer-events-auto z-10 truncate bg-red-600`}
                                                    >
                                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                                    </Link>
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
                <div className="flex items-center"><span className="w-4 h-1 bg-gray-200 opacity-60 mr-1 rounded-full"></span> Planned Baseline</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-600 mr-1 animate-pulse"></span> Delay</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span> Completed</div>
                <div className="border-l border-gray-200 h-3 mx-1"></div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Urgent</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span> High</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Medium</div>
                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Low</div>
            </div>
        </div>
    )
}
