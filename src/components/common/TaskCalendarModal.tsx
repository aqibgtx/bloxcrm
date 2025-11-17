import { motion } from 'framer-motion'
import { X, Clock, Check, Circle, Edit, Trash2, Plus } from 'lucide-react'

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

interface TaskCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  tasks: DailyTask[]
  onToggleTask: (taskId: string, completed: boolean) => void
  onEditTask: (task: DailyTask) => void
  onDeleteTask: (taskId: string) => void
  onAddTask: (date: Date) => void
}

export default function TaskCalendarModal({
  isOpen,
  onClose,
  date,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTask
}: TaskCalendarModalProps) {
  if (!isOpen) return null

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    // timeStr is in format "HH:MM:SS"
    const [hoursStr, minutes] = timeStr.split(':')
    const hours = parseInt(hoursStr, 10)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes} ${period}`
  }

  const formatDateDisplay = (date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {formatDateDisplay(date)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAddTask(date)}
              className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`border rounded-xl p-4 transition-all ${
                  task.completed
                    ? 'bg-green-50 border-green-200'
                    : 'border-gray-200 hover:border-empire-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => onToggleTask(task.id, task.completed)}
                    className={`mt-1 transition-colors ${
                      task.completed ? 'text-green-600' : 'text-gray-400 hover:text-empire-600'
                    }`}
                  >
                    {task.completed ? <Check size={20} /> : <Circle size={20} />}
                  </button>

                  <div className="flex-1">
                    <h5 className={`font-medium ${
                      task.completed ? 'text-green-800 line-through' : 'text-gray-800'
                    }`}>
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className={`text-sm mt-1 ${
                        task.completed ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {task.description}
                      </p>
                    )}
                    {(task.start_time || task.end_time) && (
                      <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>
                          {task.start_time && formatTime(task.start_time)}
                          {task.start_time && task.end_time && ' - '}
                          {task.end_time && formatTime(task.end_time)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditTask(task)}
                      className="text-gray-400 hover:text-empire-600 p-1.5 rounded transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks scheduled for this date</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
