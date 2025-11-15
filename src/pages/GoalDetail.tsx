import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, Clock, Check, Circle, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/common/Modal'
import TaskCalendarModal from '../components/common/TaskCalendarModal'
import { formatDate, getMonthCalendarDays, getWeekDays, getLocalDateString } from '../utils/dateFormat'

interface Goal {
  id: string
  title: string | null
  type: string | null
  category: string | null
  description: string | null
  target: number | null
  progress: number
  deadline: string | null
  week_end_date: string | null
  color: string | null
  is_active: boolean
  created_at: string
  week_titles?: { [key: number]: string }
  week_descriptions?: { [key: number]: string }
}

interface DailyTask {
  id: string
  goal_id: string
  title: string
  description: string | null
  completed: boolean
  date: string
  start_time: string | null
  end_time: string | null
  created_at: string
}

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null)
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    date: getLocalDateString(),
    start_time: '',
    end_time: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarModalDate, setCalendarModalDate] = useState<Date | null>(null)
  const [showAddForAllModal, setShowAddForAllModal] = useState(false)
  const [addForAllData, setAddForAllData] = useState({
    title: '',
    start_time: '',
    end_time: ''
  })
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [weekTitles, setWeekTitles] = useState<{ [key: number]: string }>({})
  const [weekDescriptions, setWeekDescriptions] = useState<{ [key: number]: string }>({})
  const [editingWeekInfo, setEditingWeekInfo] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      fetchGoalData()
      fetchTasks()
    }
  }, [id, selectedDate])

  useEffect(() => {
    if (goal?.type === 'monthly' && goal?.deadline) {
      setCurrentDate(new Date(goal.deadline))
    }
  }, [goal])

  const fetchGoalData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setGoal(data)

      // Load week titles and descriptions if they exist
      if (data.week_titles) {
        setWeekTitles(data.week_titles)
      }
      if (data.week_descriptions) {
        setWeekDescriptions(data.week_descriptions)
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('date', { ascending: false })
        .order('start_time', { ascending: true, nullsLast: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const handleSaveTask = async () => {
    try {
      setSaving(true)
      
      const processedData = {
        ...taskData,
        goal_id: id,
        start_time: taskData.start_time || null,
        end_time: taskData.end_time || null
      }
      
      if (editingTask) {
        const { error } = await supabase
          .from('daily_tasks')
          .update(processedData)
          .eq('id', editingTask.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('daily_tasks')
          .insert(processedData)
        
        if (error) throw error
      }
      
      const wasAddingFromCalendar = !editingTask && showCalendarModal

      setShowTaskModal(false)
      setEditingTask(null)
      setTaskData({
        title: '',
        description: '',
        date: getLocalDateString(),
        start_time: '',
        end_time: ''
      })

      if (editingTask) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...processedData } : t))
      } else {
        fetchTasks()
      }

      updateGoalProgress()

      if (wasAddingFromCalendar && calendarModalDate) {
        setShowCalendarModal(true)
      }
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t))

      const { error } = await supabase
        .from('daily_tasks')
        .update({ completed: !completed })
        .eq('id', taskId)

      if (error) throw error

      updateGoalProgress()
    } catch (error) {
      console.error('Error toggling task:', error)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t))
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      setTasks(prev => prev.filter(t => t.id !== taskId))

      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      updateGoalProgress()
    } catch (error) {
      console.error('Error deleting task:', error)
      fetchTasks()
    }
  }

  const updateGoalProgress = async () => {
    try {
      const totalTasks = tasks.length
      const completedTasks = tasks.filter(task => task.completed).length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      setGoal(prev => prev ? { ...prev, progress } : null)

      const { error } = await supabase
        .from('goals')
        .update({ progress })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating goal progress:', error)
    }
  }

  const openEditTask = (task: DailyTask) => {
    setEditingTask(task)
    setTaskData({
      title: task.title,
      description: task.description || '',
      date: task.date,
      start_time: task.start_time || '',
      end_time: task.end_time || ''
    })
    setShowTaskModal(true)
  }

  const openNewTask = () => {
    setEditingTask(null)
    setTaskData({
      title: '',
      description: '',
      date: selectedDate,
      start_time: '',
      end_time: ''
    })
    setShowTaskModal(true)
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5) // HH:MM format
  }

  const getTasksForDate = (date: string) => {
    return tasks.filter(task => task.date === date)
  }

  const getUniqueTaskDates = () => {
    const dates = [...new Set(tasks.map(task => task.date))].sort((a, b) => b.localeCompare(a))
    return dates
  }

  const getTasksForCalendarDate = (date: Date) => {
    const dateStr = getLocalDateString(date)
    return tasks.filter(task => task.date === dateStr)
  }

  const openCalendarModal = (date: Date) => {
    setCalendarModalDate(date)
    setShowCalendarModal(true)
  }

  const handleAddTaskFromCalendar = (date: Date) => {
    setTaskData({
      title: '',
      description: '',
      date: getLocalDateString(date),
      start_time: '',
      end_time: ''
    })
    setShowTaskModal(true)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getMonthWeeks = () => {
    const monthDays = getMonthCalendarDays(currentDate.getFullYear(), currentDate.getMonth())
    const validDays = monthDays.filter(day => day !== null) as Date[]

    const weeks: Date[][] = []
    let currentWeek: Date[] = []

    validDays.forEach((day, idx) => {
      currentWeek.push(day)

      // If we have 7 days or it's the last day, create a new week
      if (currentWeek.length === 7 || idx === validDays.length - 1) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
    })

    return weeks
  }

  const saveWeekData = async () => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          week_titles: weekTitles,
          week_descriptions: weekDescriptions
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error saving week data:', error)
    }
  }

  const handleAddForAll = async () => {
    if (!addForAllData.title.trim()) return

    try {
      setSaving(true)

      let dates: Date[] = []

      // Get all days in the month or selected week
      if (selectedWeek !== null) {
        const weeks = getMonthWeeks()
        dates = weeks[selectedWeek] || []
      } else {
        const monthDays = getMonthCalendarDays(currentDate.getFullYear(), currentDate.getMonth())
        dates = monthDays.filter(day => day !== null) as Date[]
      }

      // Create tasks for all dates
      const tasksToInsert = dates.map(date => ({
        goal_id: id,
        title: addForAllData.title,
        description: null,
        date: getLocalDateString(date),
        start_time: addForAllData.start_time || null,
        end_time: addForAllData.end_time || null,
        completed: false
      }))

      const { error } = await supabase
        .from('daily_tasks')
        .insert(tasksToInsert)

      if (error) throw error

      // Reset form and close modal
      setAddForAllData({
        title: '',
        start_time: '',
        end_time: ''
      })
      setShowAddForAllModal(false)

      // Refresh tasks
      fetchTasks()
      updateGoalProgress()
    } catch (error) {
      console.error('Error adding tasks for all:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderMonthCalendar = () => {
    const days = getMonthCalendarDays(currentDate.getFullYear(), currentDate.getMonth())
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeks = getMonthWeeks()

    // If a week is selected, render it in weekly format
    if (selectedWeek !== null && weeks[selectedWeek]) {
      const weekDaysToDisplay = weeks[selectedWeek]
      const firstDay = weekDaysToDisplay[0]
      const lastDay = weekDaysToDisplay[weekDaysToDisplay.length - 1]

      return (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Week {selectedWeek + 1}: {firstDay.toLocaleDateString('en-GB')} - {lastDay.toLocaleDateString('en-GB')}
              </p>
            </div>
            <button
              onClick={() => setShowAddForAllModal(true)}
              className="px-5 py-2.5 bg-empire-600 text-white rounded-lg hover:bg-empire-700 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Plus size={18} />
              <span className="font-medium">Add for All</span>
            </button>
          </div>

          {/* Week Toggle Section */}
          <div className="space-y-3 pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Select Week:</span>
              {weeks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWeek(idx)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedWeek === idx
                      ? 'bg-empire-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-empire-400 hover:bg-gray-50'
                  }`}
                >
                  {weekTitles[idx] ? `Week ${idx + 1}: ${weekTitles[idx]}` : `Week ${idx + 1}`}
                </button>
              ))}
              <div className="h-5 w-px bg-gray-300 mx-1"></div>
              <button
                onClick={() => setSelectedWeek(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:border-empire-400 hover:bg-gray-50 font-medium transition-all"
              >
                View All
              </button>
            </div>
            {selectedWeek !== null && (
              <div className="bg-white border-2 border-empire-600 rounded-lg p-3">
                {editingWeekInfo === selectedWeek ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={weekTitles[selectedWeek] || ''}
                      onChange={(e) => setWeekTitles({ ...weekTitles, [selectedWeek]: e.target.value })}
                      placeholder="Week title..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-empire-500"
                    />
                    <textarea
                      value={weekDescriptions[selectedWeek] || ''}
                      onChange={(e) => setWeekDescriptions({ ...weekDescriptions, [selectedWeek]: e.target.value })}
                      placeholder="Week description..."
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-empire-500"
                    />
                    <button
                      onClick={() => {
                        setEditingWeekInfo(null)
                        saveWeekData()
                      }}
                      className="px-3 py-1 text-sm bg-empire-600 text-white rounded-lg hover:bg-empire-700"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">
                        {weekTitles[selectedWeek] || 'No title'}
                      </div>
                      {weekDescriptions[selectedWeek] && (
                        <div className="text-xs text-gray-600 mt-1">
                          {weekDescriptions[selectedWeek]}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingWeekInfo(selectedWeek)}
                      className="text-gray-400 hover:text-empire-600 p-1"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Weekly Format Display */}
          <div className="grid grid-cols-7 gap-3">
            {weekDaysToDisplay.map((day, idx) => {
              const dayTasks = getTasksForCalendarDate(day)
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div
                  key={idx}
                  onClick={() => openCalendarModal(day)}
                  className={`border-2 rounded-xl p-4 min-h-[140px] ${
                    isToday
                      ? 'border-empire-500 bg-empire-50 shadow-md'
                      : 'border-gray-200 hover:border-empire-400 hover:shadow-sm bg-white'
                  } cursor-pointer transition-all`}
                >
                  <div className="text-center mb-3 pb-2 border-b border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{weekDays[day.getDay()]}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">{day.getDate()}</div>
                  </div>
                  <div className="space-y-1.5">
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        className={`text-xs px-2 py-1.5 rounded-md truncate font-medium ${
                          task.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-empire-600 font-semibold w-full text-center pt-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Default full month view
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setShowAddForAllModal(true)}
            className="px-5 py-2.5 bg-empire-600 text-white rounded-lg hover:bg-empire-700 transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus size={18} />
            <span className="font-medium">Add for All</span>
          </button>
        </div>

        {/* Week Toggle Section */}
        <div className="space-y-3 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-600">Select Week:</span>
            {weeks.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedWeek(idx)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:border-empire-400 hover:bg-gray-50 font-medium transition-all"
              >
                {weekTitles[idx] ? `Week ${idx + 1}: ${weekTitles[idx]}` : `Week ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-3">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="min-h-[140px]" />
            const dayTasks = getTasksForCalendarDate(day)
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div
                key={idx}
                onClick={() => openCalendarModal(day)}
                className={`border-2 rounded-xl p-4 min-h-[140px] ${
                  isToday
                    ? 'border-empire-500 bg-empire-50 shadow-md'
                    : 'border-gray-200 hover:border-empire-400 hover:shadow-sm bg-white'
                } cursor-pointer transition-all`}
              >
                <div className="text-center mb-3 pb-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{weekDays[day.getDay()]}</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{day.getDate()}</div>
                </div>
                <div className="space-y-1.5">
                  {dayTasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      className={`text-xs px-2 py-1.5 rounded-md truncate font-medium ${
                        task.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-empire-600 font-semibold w-full text-center pt-1">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-empire-600"></div>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Goal Not Found</h1>
          <button
            onClick={() => navigate('/goals')}
            className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors"
          >
            Back to Goals
          </button>
        </div>
      </div>
    )
  }

  const tasksForSelectedDate = getTasksForDate(selectedDate)
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/goals')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{goal.title}</h1>
            <p className="text-gray-500">Goal Task Management</p>
          </div>
        </div>

        {/* Goal Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
              >
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="font-semibold text-gray-800">
                  {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Tasks</p>
                <p className="font-semibold text-gray-800">{completedTasks} / {totalTasks}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Circle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-semibold text-gray-800">{progressPercentage}%</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-sm">{goal.target || 0}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target</p>
                <p className="font-semibold text-gray-800">{goal.target || 0}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Task Progress</span>
              <span className="text-sm font-medium text-gray-800">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="h-2 rounded-full"
                style={{ backgroundColor: goal.color || '#d97706' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>
        </motion.div>

        {/* Calendar View */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Task Calendar</h3>
              <p className="text-sm text-gray-500">View and manage tasks in calendar view</p>
            </div>

          <div className="p-6">
            {/* Calendar Rendering */}
            {renderMonthCalendar()}
          </div>
        </motion.div>

        {/* Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
          title={editingTask ? 'Edit Task' : 'Add New Task'}
          subtitle={!editingTask && taskData.date ? new Date(taskData.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
        >
          <div className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>

            {editingTask && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                    placeholder="Describe the task..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={taskData.date}
                    onChange={(e) => setTaskData({ ...taskData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                    required
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={taskData.start_time}
                  onChange={(e) => setTaskData({ ...taskData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={taskData.end_time}
                  onChange={(e) => setTaskData({ ...taskData, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowTaskModal(false)
                  setEditingTask(null)
                }}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                disabled={saving || !taskData.title.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingTask ? 'Update Task' : 'Add Task'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Calendar Modal */}
        {calendarModalDate && (
          <TaskCalendarModal
            isOpen={showCalendarModal}
            onClose={() => setShowCalendarModal(false)}
            date={calendarModalDate}
            tasks={getTasksForCalendarDate(calendarModalDate)}
            onToggleTask={toggleTask}
            onEditTask={openEditTask}
            onDeleteTask={deleteTask}
            onAddTask={handleAddTaskFromCalendar}
          />
        )}

        {/* Add for All Modal */}
        <Modal
          isOpen={showAddForAllModal}
          onClose={() => {
            setShowAddForAllModal(false)
            setAddForAllData({ title: '', start_time: '', end_time: '' })
          }}
          title="Add Task for All Days (Month)"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={addForAllData.title}
                onChange={(e) => setAddForAllData({ ...addForAllData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={addForAllData.start_time}
                  onChange={(e) => setAddForAllData({ ...addForAllData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={addForAllData.end_time}
                  onChange={(e) => setAddForAllData({ ...addForAllData, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowAddForAllModal(false)
                  setAddForAllData({ title: '', start_time: '', end_time: '' })
                }}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddForAll}
                disabled={saving || !addForAllData.title.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add for All Days'}
              </button>
            </div>
          </div>
        </Modal>
      </motion.div>
    </div>
  )
}