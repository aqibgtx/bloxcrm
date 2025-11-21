import { motion } from 'framer-motion'
import { Plus, Target, Calendar, CheckCircle, Circle, Edit, Trash2, ArrowRight, Info, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, getLocalDateString } from '../utils/dateFormat'
import Modal from '../components/common/Modal'
import { Link } from 'react-router-dom'

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
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [activeTab, setActiveTab] = useState('daily')
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoGoal, setInfoGoal] = useState<Goal | null>(null)

  const [goalData, setGoalData] = useState({
    title: '',
    type: 'monthly',
    category: 'Monthly',
    description: '',
    target: '',
    deadline: getLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    week_end_date: '',
    color: '#8b5cf6'
  })

  const [taskData, setTaskData] = useState({
    title: '',
    description: ''
  })

  const goalTypes = [
    { value: 'monthly', label: 'Monthly', color: '#8b5cf6' }
  ]

  useEffect(() => {
    fetchGoals()
    fetchTodaysTasks()
  }, [])

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchTodaysTasks()
    }
  }, [activeTab])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodaysTasks = async () => {
    try {
      const today = getLocalDateString()
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('date', today)

      if (error) throw error

      // Sort: completed tasks first, then uncompleted
      const sortedData = (data || []).sort((a, b) => {
        if (a.completed === b.completed) return 0
        return a.completed ? -1 : 1
      })

      setDailyTasks(sortedData)
    } catch (error) {
      console.error('Error fetching daily tasks:', error)
    }
  }

  const handleSaveGoal = async () => {
    try {
      setSaving(true)

      const processedData = {
        title: goalData.title,
        type: goalData.type,
        category: goalData.category,
        description: goalData.description,
        target: parseInt(goalData.target) || 0,
        deadline: goalData.deadline || null,
        week_end_date: goalData.week_end_date || null,
        color: goalData.color
      }
      
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(processedData)
          .eq('id', editingGoal.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('goals')
          .insert(processedData)
        
        if (error) throw error
      }
      
      setShowGoalModal(false)
      setEditingGoal(null)
      resetGoalData()

      setTimeout(() => {
        fetchGoals()
      }, 100)
    } catch (error) {
      console.error('Error saving goal:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTask = async () => {
    if (!selectedGoal) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('daily_tasks')
        .insert({
          goal_id: selectedGoal.id,
          title: taskData.title,
          description: taskData.description,
          date: getLocalDateString()
        })

      if (error) throw error

      setShowTaskModal(false)
      setTaskData({ title: '', description: '' })
      fetchTodaysTasks()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      // Optimistically update and re-sort immediately
      setDailyTasks(prev => {
        const updated = prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t)
        // Sort: completed tasks first, then uncompleted
        return updated.sort((a, b) => {
          if (a.completed === b.completed) return 0
          return a.completed ? -1 : 1
        })
      })

      const { error } = await supabase
        .from('daily_tasks')
        .update({ completed: !completed })
        .eq('id', taskId)

      if (error) throw error
    } catch (error) {
      console.error('Error toggling task:', error)
      // Revert on error
      setDailyTasks(prev => {
        const reverted = prev.map(t => t.id === taskId ? { ...t, completed } : t)
        return reverted.sort((a, b) => {
          if (a.completed === b.completed) return 0
          return a.completed ? -1 : 1
        })
      })
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      setGoals(prev => prev.filter(g => g.id !== goalId))
      setDailyTasks(prev => prev.filter(task => task.goal_id !== goalId))

      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', goalId)

      if (error) throw error

      const { error: deleteTasksError } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('goal_id', goalId)

      if (deleteTasksError) throw deleteTasksError
    } catch (error) {
      console.error('Error deleting goal:', error)
      fetchGoals()
      fetchTodaysTasks()
    }
  }

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalData({
      title: goal.title || '',
      type: goal.type || 'daily',
      category: goal.category || 'Daily',
      description: goal.description || '',
      target: goal.target?.toString() || '',
      deadline: goal.deadline || '',
      week_end_date: goal.week_end_date || '',
      color: goal.color || '#10b981'
    })
    setShowGoalModal(true)
  }

  const resetGoalData = () => {
    const now = new Date()
    const currentMonthYear = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1))

    setGoalData({
      title: '',
      type: 'monthly',
      category: 'Monthly',
      description: '',
      target: '',
      deadline: currentMonthYear,
      week_end_date: '',
      color: '#8b5cf6'
    })
  }

  const getProgressPercentage = (progress: number, target: number) => {
    if (!target) return 0
    return Math.min(Math.round((progress / target) * 100), 100)
  }

  const getTypeColor = (type: string) => {
    const typeConfig = goalTypes.find(t => t.value === type)
    return typeConfig?.color || '#d97706'
  }

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return ''
    // timeString is in format "HH:MM:SS"
    const [hoursStr, minutes] = timeString.split(':')
    const hours = parseInt(hoursStr, 10)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes} ${period}`
  }

  const groupedGoals = {
    weekly: goals.filter(g => g.type === 'weekly'),
    monthly: goals.filter(g => g.type === 'monthly'),
    yearly: goals.filter(g => g.type === 'yearly')
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

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Productivity Goals</h1>
            <p className="text-gray-500">Track your daily progress and achieve your targets</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl p-2 shadow-lg mb-8"
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'daily'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Daily Tasks
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Goals
            </button>
          </div>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* New Goal Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-end"
            >
              <button 
                onClick={() => setShowGoalModal(true)}
                className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus size={16} />
                <span>New Goal</span>
              </button>
            </motion.div>

            {goalTypes.map((type, typeIndex) => (
              <motion.div
                key={type.value}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: typeIndex * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <h3 className="text-lg font-semibold text-gray-800">{type.label} Goals</h3>
                    <span className="text-sm text-gray-500">
                      ({groupedGoals[type.value as keyof typeof groupedGoals].length})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedGoals[type.value as keyof typeof groupedGoals].map((goal, index) => (
                    <motion.div
                      key={goal.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="border border-gray-200 rounded-xl p-4 hover:border-empire-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-800 mb-1">{goal.title}</h4>
                            {goal.description && (
                              <button
                                onClick={() => {
                                  setInfoGoal(goal)
                                  setShowInfoModal(true)
                                }}
                                className="text-gray-400 hover:text-empire-600 transition-colors"
                              >
                                <Info size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditGoal(goal)}
                            className="text-gray-400 hover:text-empire-600 p-1 rounded transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar size={14} />
                          <span>
                            {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/goals/${goal.id}`}
                            className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors font-bold shadow-lg hover:shadow-xl flex items-center space-x-2"
                          >
                            <span>ENTER</span>
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {groupedGoals[type.value as keyof typeof groupedGoals].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No {type.label.toLowerCase()} goals yet</p>
                    <button
                      onClick={() => {
                        setGoalData({ ...goalData, type: type.value, color: type.color })
                        setShowGoalModal(true)
                      }}
                      className="text-empire-600 hover:text-empire-700 text-sm mt-2"
                    >
                      Create your first {type.label.toLowerCase()} goal
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Daily Tasks Tab */}
        {activeTab === 'daily' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Today's Tasks</h3>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {dailyTasks.length > 0 ? dailyTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  className={`flex items-start space-x-4 p-4 border rounded-xl transition-all ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'border-gray-200 hover:border-empire-300'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`mt-1 transition-colors ${
                      task.completed ? 'text-green-600' : 'text-gray-400 hover:text-empire-600'
                    }`}
                  >
                    {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        task.completed ? 'text-green-800 line-through' : 'text-gray-800'
                      }`}>
                        {task.title}
                      </h4>
                      {(task.start_time || task.end_time) && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock size={14} />
                          <span>
                            {task.start_time && formatTime(task.start_time)}
                            {task.start_time && task.end_time && ' - '}
                            {task.end_time && formatTime(task.end_time)}
                          </span>
                        </div>
                      )}
                    </div>
                    {task.description && (
                      <p className={`text-sm mt-1 ${
                        task.completed ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">
                        Goal: {goals.find(g => g.id === task.goal_id)?.title || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks for today</h3>
                  <p className="mb-4">Select a goal and add your first task to get started</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Goal Modal */}
        <Modal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false)
            setEditingGoal(null)
            resetGoalData()
          }}
          title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Title *
              </label>
              <input
                type="text"
                value={goalData.title}
                onChange={(e) => setGoalData({ ...goalData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Enter goal title..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={goalData.type}
                  onChange={(e) => {
                    const selectedType = goalTypes.find(t => t.value === e.target.value)
                    setGoalData({ 
                      ...goalData, 
                      type: e.target.value,
                      color: selectedType?.color || '#d97706',
                      category: selectedType?.label || 'General'
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                >
                  {goalTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target
                </label>
                <input
                  type="number"
                  value={goalData.target}
                  onChange={(e) => setGoalData({ ...goalData, target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={goalData.description}
                onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                placeholder="Describe your goal and what you want to achieve..."
              />
            </div>

            {goalData.type === 'weekly' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={goalData.deadline}
                    onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={goalData.week_end_date}
                    onChange={(e) => setGoalData({ ...goalData, week_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : goalData.type === 'monthly' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={goalData.deadline ? (() => {
                      const [year, month] = goalData.deadline.split('-')
                      return parseInt(month) - 1
                    })() : new Date().getMonth()}
                    onChange={(e) => {
                      const currentYear = goalData.deadline ? goalData.deadline.split('-')[0] : new Date().getFullYear().toString()
                      const month = (parseInt(e.target.value) + 1).toString().padStart(2, '0')
                      setGoalData({ ...goalData, deadline: `${currentYear}-${month}-01` })
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  >
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={goalData.deadline ? goalData.deadline.split('-')[0] : new Date().getFullYear()}
                    onChange={(e) => {
                      const currentMonth = goalData.deadline ? goalData.deadline.split('-')[1] : (new Date().getMonth() + 1).toString().padStart(2, '0')
                      setGoalData({ ...goalData, deadline: `${e.target.value}-${currentMonth}-01` })
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={goalData.deadline}
                  onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowGoalModal(false)
                  setEditingGoal(null)
                  resetGoalData()
                }}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                disabled={saving || !goalData.title.trim()}
                className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false)
            setTaskData({ title: '', description: '' })
          }}
          title="Add Daily Task"
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

            {selectedGoal && (
              <div className="bg-empire-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  This task will be added to: <strong>{selectedGoal.title}</strong>
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowTaskModal(false)
                  setTaskData({ title: '', description: '' })
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
                {saving ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Info Modal */}
        <Modal
          isOpen={showInfoModal}
          onClose={() => {
            setShowInfoModal(false)
            setInfoGoal(null)
          }}
          title="Goal Information"
        >
          {infoGoal && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{infoGoal.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{infoGoal.deadline ? formatDate(infoGoal.deadline) : 'No deadline'}</span>
                  </span>
                  <span>Target: {infoGoal.target || 0}</span>
                  <span>Progress: {infoGoal.progress}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  {infoGoal.description || 'No description available'}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </div>
  )
}
