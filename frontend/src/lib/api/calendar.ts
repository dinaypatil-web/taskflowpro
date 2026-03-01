import apiClient from './client'
import { CalendarEvent } from '@/types/task'

export interface CalendarMonthResponse {
    year: number
    month: number
    events: Record<string, CalendarEvent[]>
    totalEvents: number
}

export const calendarApi = {
    getEvents: async (params: { startDate?: string; endDate?: string; taskId?: string } = {}): Promise<CalendarEvent[]> => {
        const response = await apiClient.get('/calendar/events', { params })
        return response.data
    },

    getMonthView: async (year: number, month: number): Promise<CalendarMonthResponse> => {
        const response = await apiClient.get(`/calendar/month/${year}/${month}`)
        return response.data
    },

    getWeekView: async (startDate: string): Promise<any> => {
        const response = await apiClient.get('/calendar/week', { params: { startDate } })
        return response.data
    },

    getDayView: async (date: string): Promise<any> => {
        const response = await apiClient.get('/calendar/day', { params: { date } })
        return response.data
    },

    createEvent: async (data: any): Promise<CalendarEvent> => {
        const response = await apiClient.post('/calendar/events', data)
        return response.data
    },

    updateEvent: async (id: string, data: any): Promise<CalendarEvent> => {
        const response = await apiClient.patch(`/calendar/events/${id}`, data)
        return response.data
    },

    deleteEvent: async (id: string): Promise<{ message: string }> => {
        const response = await apiClient.delete(`/calendar/events/${id}`)
        return response.data
    },

    syncTask: async (taskId: string): Promise<CalendarEvent> => {
        const response = await apiClient.post(`/calendar/sync-task/${taskId}`)
        return response.data
    },
}
