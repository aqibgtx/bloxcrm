import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getLocalDateString } from '../../utils/dateFormat'

interface Project {
  id: string
  name: string
  progress?: number
}

interface ProjectProgressProps {
  onLoaded?: () => void
  data?: any
}

export default function ProjectProgress({ onLoaded, data: propData }: ProjectProgressProps) {
  const [progress, setProgress] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')

  useEffect(() => {
    if (propData && propData.length > 0) {
      setProjects(propData)
      setSelectedProject('all')
      calculateOverallProgress(propData)
      if (onLoaded) onLoaded()
    } else {
      fetchCurrentMonthProjects()
    }
  }, [propData])

  useEffect(() => {
    if (selectedProject === 'all') {
      calculateOverallProgress(projects)
    } else if (selectedProject) {
      fetchProjectProgress(selectedProject)
    }
  }, [selectedProject])

  const fetchCurrentMonthProjects = async () => {
    try {
      const today = new Date()
      const startDate = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1))
      const endDate = getLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0))

      const { data } = await supabase
        .from('projects')
        .select('id, name, progress')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .neq('status', 'Inactive')

      if (data && data.length > 0) {
        setProjects(data)
        setSelectedProject('all')
        calculateOverallProgress(data)
      }
      if (onLoaded) onLoaded()
    } catch (error) {
      console.error('Error fetching projects:', error)
      if (onLoaded) onLoaded()
    }
  }

  const calculateOverallProgress = (projectsList: Project[]) => {
    if (projectsList.length === 0) {
      setProgress(0)
      return
    }
    const totalProgress = projectsList.reduce((sum, p) => sum + (p.progress || 0), 0)
    const avgProgress = Math.round(totalProgress / projectsList.length)
    setProgress(avgProgress)
  }

  const fetchProjectProgress = async (projectId: string) => {
    try {
      const { data: phases } = await supabase
        .from('project_phases')
        .select('completed')
        .eq('project_id', projectId)

      if (phases && phases.length > 0) {
        const completedCount = phases.filter(p => p.completed).length
        const progressPercent = Math.round((completedCount / phases.length) * 100)
        setProgress(progressPercent)
      } else {
        // Use project's progress field if no phases
        const project = projects.find(p => p.id === projectId)
        setProgress(project?.progress || 0)
      }
    } catch (error) {
      console.error('Error fetching project progress:', error)
    }
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Progress</h3>

      {projects.length > 0 && (
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-6 text-sm"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#d97706"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - progress / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{progress}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}