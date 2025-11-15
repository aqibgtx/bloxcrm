import { motion } from 'framer-motion'
import { Calendar, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, getLocalDateString } from '../../utils/dateFormat'

interface Reminder {
  id: string
  title: string | null
  start_time: string | null
  end_time: string | null
  description: string | null
}

interface RemindersProps {
  onLoaded?: () => void
  data?: any
}

export default function Reminders({ onLoaded, data: propData }: RemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    description: ''
  })

  useEffect(() => {
    if (propData) {
      setReminders(propData)
      setLoading(false)
      if (onLoaded) onLoaded()
    } else {
      fetchReminders()
    }
  }, [propData])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('start_time', { ascending: true })
      
      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
      if (onLoaded) onLoaded()
    }
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatReminderDate = (timeStr: string | null) => {
    if (!timeStr) return ''
    return formatDate(timeStr)
  }

  const handleSave = async () => {
    try {
      const startDateTime = formData.date && formData.time ? new Date(`${formData.date}T${formData.time}`).toISOString() : null

      const reminderData = {
        title: formData.title,
        start_time: startDateTime,
        end_time: startDateTime,
        description: formData.description
      }

      if (editingReminder) {
        await supabase.from('reminders').update(reminderData).eq('id', editingReminder.id)
      } else {
        await supabase.from('reminders').insert(reminderData)
      }

      setShowModal(false)
      setEditingReminder(null)
      setFormData({ title: '', date: '', time: '', description: '' })
      fetchReminders()
    } catch (error) {
      console.error('Error saving reminder:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return
    try {
      await supabase.from('reminders').delete().eq('id', id)
      fetchReminders()
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const openEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    const dateObj = reminder.start_time ? new Date(reminder.start_time) : null
    setFormData({
      title: reminder.title || '',
      date: dateObj ? getLocalDateString(dateObj) : '',
      time: dateObj ? dateObj.toTimeString().slice(0, 5) : '',
      description: reminder.description || ''
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Reminders</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-empire-600"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Reminders</h3>
          <button
            onClick={() => setShowModal(true)}
            className="bg-empire-600 text-white p-2 rounded-lg hover:bg-empire-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {reminders.length > 0 ? reminders.map((reminder) => (
          <div key={reminder.id} className="mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-empire-100 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6 text-empire-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">{reminder.title}</h4>
                <div className="space-y-1 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>Date: {formatReminderDate(reminder.start_time)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>Time: {formatTime(reminder.start_time)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open('https://meet.google.com/', '_blank')}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Start Meeting
                  </button>
                  <button
                    onClick={() => openEdit(reminder)}
                    className="text-gray-400 hover:text-empire-600 p-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="text-gray-400 hover:text-red-600 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reminders scheduled</p>
          </div>
        )}
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{editingReminder ? 'Edit' : 'Add'} Reminder</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-empire-600 text-white px-4 py-2 rounded-lg hover:bg-empire-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingReminder(null)
                    setFormData({ title: '', date: '', time: '', description: '' })
                  }}
                  className="flex-1 border px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}