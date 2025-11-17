import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, getLocalDateString } from '../../utils/dateFormat'

interface Project {
  id: string
  name: string | null
  due_date: string | null
  status: string | null
}

const statusColors = [
  'bg-blue-500',
  'bg-cyan-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500'
]

const statusBadgeColors: { [key: string]: string } = {
  'Active': 'bg-green-100 text-green-700',
  'Inactive': 'bg-gray-100 text-gray-700',
  'Closed': 'bg-blue-100 text-blue-700',
  'Bug Fix': 'bg-red-100 text-red-700',
  'Upgrade': 'bg-purple-100 text-purple-700',
  'Pending': 'bg-yellow-100 text-yellow-700'
}

interface ProjectListProps {
  onLoaded?: () => void
  data?: any
}

export default function ProjectList({ onLoaded, data: propData }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (propData) {
      setProjects(propData)
      setLoading(false)
      if (onLoaded) onLoaded()
    } else {
      fetchProjects()
    }
  }, [propData])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const today = new Date()
      const startDate = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1))
      const endDate = getLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0))

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, due_date, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .neq('status', 'Inactive')
        .order('due_date', { ascending: true, nullsLast: true })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
      if (onLoaded) onLoaded()
    }
  }

  const getProjectColor = (index: number) => {
    return statusColors[index % statusColors.length]
  }

  if (loading) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Monthly Projects</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-empire-600"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Monthly Projects</h3>

      <div className="space-y-3">
        {projects.length > 0 ? projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className={`w-2 h-8 ${getProjectColor(index)} rounded-full`}></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-800">{project.name || 'Untitled Project'}</h4>
                {project.status && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                    {project.status}
                  </span>
                )}
              </div>
              {project.due_date && (
                <p className="text-xs text-gray-500">
                  {formatDate(project.due_date)}
                </p>
              )}
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <p>No active projects found</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}