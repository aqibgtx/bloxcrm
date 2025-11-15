import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FileText, Plus, Edit, Calendar, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Modal from '../common/Modal'
import { formatDate } from '../../utils/dateFormat'

interface Phase {
  id: string
  title: string | null
  description: string | null
  due_date: string | null
  completed: boolean
}

interface ChapterProps {
  projectId: string
  onUpdate: () => void
}

export default function Chapter({ projectId, onUpdate }: ChapterProps) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [projectScope, setProjectScope] = useState('')
  const [showScopeModal, setShowScopeModal] = useState(false)
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null)
  const [phaseData, setPhaseData] = useState({
    title: '',
    description: '',
    due_date: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchChapterData()
  }, [projectId])

  const fetchChapterData = async () => {
    try {
      setLoading(true)
      
      // Fetch project scope
      const { data: projectData } = await supabase
        .from('projects')
        .select('initial_project_scope')
        .eq('id', projectId)
        .single()
      
      if (projectData) {
        setProjectScope(projectData.initial_project_scope || '')
      }

      // Fetch phases
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      
      if (phasesData) {
        setPhases(phasesData)
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveScope = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('projects')
        .update({ initial_project_scope: projectScope })
        .eq('id', projectId)

      if (error) throw error

      setShowScopeModal(false)
    } catch (error) {
      console.error('Error saving scope:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePhase = async () => {
    try {
      setSaving(true)
      
      // Prepare phase data with proper null handling for empty date
      const processedPhaseData = {
        ...phaseData,
        due_date: phaseData.due_date === '' ? null : phaseData.due_date
      }
      
      if (editingPhase) {
        // Update existing phase
        const { error } = await supabase
          .from('project_phases')
          .update(processedPhaseData)
          .eq('id', editingPhase.id)
        
        if (error) throw error
      } else {
        // Create new phase
        const { error } = await supabase
          .from('project_phases')
          .insert({
            ...processedPhaseData,
            project_id: projectId
          })
        
        if (error) throw error
      }
      
      let updatedPhases
      if (editingPhase) {
        updatedPhases = phases.map(p => p.id === editingPhase.id ? { ...p, ...processedPhaseData } : p)
      } else {
        const { data } = await supabase.from('project_phases').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).single()
        if (data) {
          updatedPhases = [...phases, data]
        }
      }

      if (updatedPhases) {
        setPhases(updatedPhases)
        await updateProjectProgress(updatedPhases)
      }

      setShowPhaseModal(false)
      setEditingPhase(null)
      setPhaseData({ title: '', description: '', due_date: '' })
    } catch (error) {
      console.error('Error saving phase:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateProjectProgress = async (updatedPhases: Phase[]) => {
    try {
      const totalPhases = updatedPhases.length
      const completedPhases = updatedPhases.filter(p => p.completed).length
      const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

      await supabase
        .from('projects')
        .update({ progress })
        .eq('id', projectId)
    } catch (error) {
      console.error('Error updating project progress:', error)
    }
  }

  const handleTogglePhase = async (phaseId: string, completed: boolean) => {
    try {
      const updatedPhases = phases.map(p => p.id === phaseId ? { ...p, completed: !completed } : p)
      setPhases(updatedPhases)

      const { error } = await supabase
        .from('project_phases')
        .update({ completed: !completed })
        .eq('id', phaseId)

      if (error) throw error

      await updateProjectProgress(updatedPhases)
    } catch (error) {
      console.error('Error toggling phase:', error)
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, completed } : p))
    }
  }

  const openEditPhase = (phase: Phase) => {
    setEditingPhase(phase)
    setPhaseData({
      title: phase.title || '',
      description: phase.description || '',
      due_date: phase.due_date || ''
    })
    setShowPhaseModal(true)
  }

  const openNewPhase = () => {
    setEditingPhase(null)
    setPhaseData({ title: '', description: '', due_date: '' })
    setShowPhaseModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-empire-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Project Scope */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-empire-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-empire-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Project Scope</h3>
              <p className="text-sm text-gray-500">Initial project requirements and scope</p>
            </div>
          </div>
          <button
            onClick={() => setShowScopeModal(true)}
            className="bg-empire-600 text-white px-4 py-2 rounded-xl hover:bg-empire-700 transition-colors"
          >
            Scope
          </button>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-5">
            {projectScope || 'No project scope defined. Click "Scope" to add initial project requirements.'}
          </p>
        </div>
      </motion.div>

      {/* Project Phases */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Project Phases</h3>
          <button
            onClick={openNewPhase}
            className="flex items-center space-x-2 text-empire-600 hover:bg-empire-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>Add Phase</span>
          </button>
        </div>

        <div className="space-y-4">
          {phases.length > 0 ? phases.map((phase, index) => (
            <motion.div
              key={phase.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className={`border rounded-xl p-4 transition-all ${
                phase.completed ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-empire-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <button
                  onClick={() => handleTogglePhase(phase.id, phase.completed)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    phase.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-empire-500'
                  }`}
                >
                  {phase.completed && <Check size={14} />}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${phase.completed ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                      {phase.title}
                    </h4>
                    <button
                      onClick={() => openEditPhase(phase)}
                      className="text-gray-400 hover:text-empire-600 p-1 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                  
                  {phase.description && (
                    <p className={`text-sm mb-2 ${phase.completed ? 'text-green-700' : 'text-gray-600'}`}>
                      {phase.description}
                    </p>
                  )}
                  
                  {phase.due_date && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>Due: {formatDate(phase.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No phases added yet</p>
              <p className="text-sm">Click "Add Phase" to create project milestones</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Scope Modal */}
      <Modal
        isOpen={showScopeModal}
        onClose={() => setShowScopeModal(false)}
        title="Edit Project Scope"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Scope & Requirements
            </label>
            <textarea
              rows={8}
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Define the initial project scope, requirements, and objectives..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowScopeModal(false)}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveScope}
              disabled={saving}
              className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Scope'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Phase Modal */}
      <Modal
        isOpen={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
        title={editingPhase ? 'Edit Phase' : 'Add New Phase'}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase Title
            </label>
            <input
              type="text"
              value={phaseData.title}
              onChange={(e) => setPhaseData({ ...phaseData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Enter phase title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={phaseData.description}
              onChange={(e) => setPhaseData({ ...phaseData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Describe this phase..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={phaseData.due_date}
              onChange={(e) => setPhaseData({ ...phaseData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowPhaseModal(false)}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePhase}
              disabled={saving}
              className="px-6 py-2 bg-empire-600 text-white rounded-xl hover:bg-empire-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingPhase ? 'Update Phase' : 'Add Phase'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}