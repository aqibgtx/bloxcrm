import { motion } from 'framer-motion'
import { CheckCircle, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getLocalDateString } from '../../utils/dateFormat'

interface DailyTask {
  id: string
  title: string
  description: string | null
  completed: boolean
  date: string
  goal_id: string
  goal_title?: string
}

interface Goal {
  id: string
  title: string | null
}

interface TeamCollaborationProps {
  onLoaded?: () => void
  data?: any
}

export default function TeamCollaboration({ onLoaded, data: propData }: TeamCollaborationProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (propData) {
      setTasks(propData)
      setLoading(false)
      if (onLoaded) onLoaded()
    } else {
      fetchTodaysTasks()
      fetchGoals()
    }
  }, [propData])

  const fetchTodaysTasks = async () => {
    try {
      const today = getLocalDateString()
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching daily tasks:', error)
    } finally {
      setLoading(false)
      if (onLoaded) onLoaded()
    }
  }

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title')
        .eq('is_active', true)

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t))
      await supabase.from('daily_tasks').update({ completed: !completed }).eq('id', taskId)
    } catch (error) {
      console.error('Error toggling task:', error)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t))
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Today's Tasks</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-empire-600"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Today's Tasks</h3>

      <div className="space-y-3">
        {tasks.length > 0 ? tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start space-x-4 p-4 border rounded-xl transition-all ${
              task.completed ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-empire-300'
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
              <h4 className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className={`text-sm mt-1 ${task.completed ? 'text-green-600' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">
                  Goal: {task.goal_title || goals.find(g => g.id === task.goal_id)?.title || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks for today</h3>
            <p className="mb-4">Select a goal and add your first task to get started</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}