'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  Search, 
  X, 
  Loader2, 
  CalendarRange, 
  AlertCircle,
  FileText
} from 'lucide-react'
import { apiSlice, endpoints } from '@/lib/apiSlice'

interface SchoolEvent {
  id: number
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  branchId?: number | null
  sessionId?: number | null
}

interface SchoolCalendarProps {
  user: {
    id: number
    username: string
    role: number
  }
}

export default function SchoolCalendar({ user }: SchoolCalendarProps) {
  const isAdmin = user.role === 2

  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Determine endpoint based on role
  const getEventsEndpoint = useMemo(() => {
    switch (user.role) {
      case 2:
        return endpoints.admin.events
      case 3:
        return endpoints.teacher.events
      case 6:
        return endpoints.parent.events
      case 7:
        return endpoints.student.events
      default:
        return endpoints.student.events // fallback
    }
  }, [user.role])

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiSlice.get<{ success: boolean; events: SchoolEvent[] }>(getEventsEndpoint)
      if (res.success) {
        setEvents(res.events)
      } else {
        setError('Failed to load events.')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [getEventsEndpoint])

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingEvent(null)
    setTitle('')
    setDescription('')
    
    // Set default date to today
    const todayStr = new Date().toISOString().split('T')[0]
    setStartDate(todayStr)
    setEndDate('')
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEdit = (event: SchoolEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setDescription(event.description || '')
    setStartDate(new Date(event.startDate).toISOString().split('T')[0])
    setEndDate(event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '')
    setIsModalOpen(true)
  }

  // Submit create or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startDate) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const payload = {
      title,
      description: description || null,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : null
    }

    try {
      if (editingEvent) {
        // Update endpoint
        const res = await apiSlice.put<{ success: boolean; message: string }>(
          endpoints.admin.eventItem(editingEvent.id),
          payload
        )
        if (res.success) {
          setSuccess('Event updated successfully!')
          fetchEvents()
          setIsModalOpen(false)
        }
      } else {
        // Create endpoint
        const res = await apiSlice.post<{ success: boolean; message: string }>(
          endpoints.admin.events,
          payload
        )
        if (res.success) {
          setSuccess('Event created successfully!')
          fetchEvents()
          setIsModalOpen(false)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save event.')
    } finally {
      setSubmitting(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  // Delete event
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    setError(null)
    setSuccess(null)
    try {
      const res = await apiSlice.delete<{ success: boolean; message: string }>(
        endpoints.admin.eventItem(id)
      )
      if (res.success) {
        setSuccess('Event deleted successfully!')
        fetchEvents()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete event.')
    } finally {
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchQuery = searchQuery.toLowerCase()
      return (
        e.title.toLowerCase().includes(matchQuery) ||
        (e.description && e.description.toLowerCase().includes(matchQuery))
      )
    })
  }, [events, searchQuery])

  // Helper: Format Date nicely
  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 md:p-8 shadow-md overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 text-xs font-bold text-white bg-white/20 rounded-full border border-white/30 shadow-xs inline-block">
              Term Schedule
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">School Events & Calendar</h1>
            <p className="text-white/80 text-sm max-w-xl font-medium">
              Stay informed with term dates, holidays, assemblies, parent meetings, and extra-curricular events.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-sm rounded-xl shadow-md transition duration-200 hover:scale-[1.02]"
            >
              <Plus size={16} />
              Create Event
            </button>
          )}
        </div>
      </div>

      {/* Alert states */}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Controls & Event List */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search events by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
          />
        </div>

        {/* List of events */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
            <p className="text-sm font-bold text-slate-400">Loading academic calendar events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredEvents.map((event) => {
              const isToday = new Date(event.startDate).toDateString() === new Date().toDateString()
              return (
                <div 
                  key={event.id}
                  className={`group relative p-5 rounded-xl border bg-white shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between ${
                    isToday ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/5' : 'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        {isToday && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-700 rounded-md inline-block">
                            Today
                          </span>
                        )}
                        <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                          {event.title}
                        </h3>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(event)}
                            className="p-1 rounded bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Event"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1 rounded bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Event"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {event.description ? (
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        {event.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic">
                        No description details provided.
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500 font-bold">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-indigo-500" />
                      <span>Starts: {formatDateString(event.startDate)}</span>
                    </div>
                    {event.endDate && (
                      <div className="flex items-center gap-2">
                        <CalendarRange size={13} className="text-violet-500" />
                        <span>Ends: {formatDateString(event.endDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-3">
            <CalendarIcon size={36} className="text-slate-300 mx-auto" />
            <p className="text-sm font-extrabold text-slate-500">No events found</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchQuery ? 'Try adjusting your search filters to find what you are looking for.' : 'No calendar events have been added for this academic term yet.'}
            </p>
            {isAdmin && !searchQuery && (
              <button
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
              >
                <Plus size={14} /> Add First Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                {editingEvent ? 'Edit Event details' : 'Add New Event'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. First Term Midterm Break"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Event Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide additional details or information about this event..."
                  rows={3}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Saving...
                    </>
                  ) : (
                    'Save Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
