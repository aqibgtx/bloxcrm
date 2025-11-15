import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { DollarSign, Plus, FileText, Calendar, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Modal from '../common/Modal'
import { formatDate } from '../../utils/dateFormat'

interface Revenue {
  id: string
  amount: number
  status: string | null
  date_issued: string | null
  paid: boolean
  pdf_url: string | null
}

interface Cost {
  id: string
  title: string
  amount: number
  created_at: string
}

interface PaymentsProps {
  projectId: string
  onUpdate: () => void
}

export default function Payments({ projectId, onUpdate }: PaymentsProps) {
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [showCostModal, setShowCostModal] = useState(false)
  const [revenueData, setRevenueData] = useState({
    amount: '',
    date_issued: '',
    pdf_url: ''
  })
  const [costData, setCostData] = useState({
    title: '',
    amount: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPaymentsData()
  }, [projectId])

  const fetchPaymentsData = async () => {
    try {
      setLoading(true)
      
      // Fetch revenues (invoices)
      const { data: revenueData } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('date_issued', { ascending: false })
      
      if (revenueData) {
        setRevenues(revenueData)
      }

      // Fetch costs
      const { data: costData } = await supabase
        .from('project_costs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (costData) {
        setCosts(costData)
      }
    } catch (error) {
      console.error('Error fetching payments data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRevenue = async () => {
    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          project_id: projectId,
          amount: parseFloat(revenueData.amount),
          date_issued: revenueData.date_issued,
          pdf_url: revenueData.pdf_url,
          status: 'paid',
          paid: true
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setRevenues(prev => [data, ...prev])
      }

      setShowRevenueModal(false)
      setRevenueData({ amount: '', date_issued: '', pdf_url: '' })
    } catch (error) {
      console.error('Error saving revenue:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCost = async () => {
    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('project_costs')
        .insert({
          project_id: projectId,
          title: costData.title,
          amount: parseFloat(costData.amount)
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setCosts(prev => [data, ...prev])
      }

      setShowCostModal(false)
      setCostData({ title: '', amount: '' })
    } catch (error) {
      console.error('Error saving cost:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`
  }

  const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue.amount, 0)
  const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0)
  const netProfit = totalRevenue - totalCost

  const getStatusColor = (status: string | null, paid: boolean) => {
    if (paid) return 'bg-green-100 text-green-700'
    switch (status) {
      case 'partial':
        return 'bg-yellow-100 text-yellow-700'
      case 'pending':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
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
      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={() => setShowRevenueModal(true)}
          className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
        >
          <Plus size={20} />
          <span className="font-medium">Add Revenue</span>
        </button>

        <button
          onClick={() => setShowCostModal(true)}
          className="flex-1 bg-red-600 text-white px-6 py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
        >
          <Plus size={20} />
          <span className="font-medium">Add Cost</span>
        </button>
      </motion.div>

      {/* Revenue Records */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Revenue Records</h3>
        
        <div className="space-y-4">
          {revenues.length > 0 ? revenues.map((revenue, index) => (
            <motion.div
              key={revenue.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{formatCurrency(revenue.amount)}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>
                          {revenue.date_issued ? formatDate(revenue.date_issued) : 'No date'}
                        </span>
                      </div>
                      {revenue.pdf_url && (
                        <a
                          href={revenue.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-empire-600 hover:text-empire-700"
                        >
                          <Download size={14} />
                          <span>PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(revenue.status, revenue.paid)}`}>
                  {revenue.paid ? 'Paid' : revenue.status || 'Pending'}
                </span>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No revenue records yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Cost Records */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Cost Records</h3>
        
        <div className="space-y-4">
          {costs.length > 0 ? costs.map((cost, index) => (
            <motion.div
              key={cost.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="border border-gray-200 rounded-xl p-4 hover:border-red-300 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{cost.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Added on {formatDate(cost.created_at)}
                    </p>
                    <p className="font-semibold text-red-600">{formatCurrency(cost.amount)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No cost records yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Revenue Modal */}
      <Modal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        title="Add Revenue Record"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revenue Amount (RM)
            </label>
            <input
              type="number"
              step="0.01"
              value={revenueData.amount}
              onChange={(e) => setRevenueData({ ...revenueData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Issued
            </label>
            <input
              type="date"
              value={revenueData.date_issued}
              onChange={(e) => setRevenueData({ ...revenueData, date_issued: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF Document URL
            </label>
            <input
              type="url"
              value={revenueData.pdf_url}
              onChange={(e) => setRevenueData({ ...revenueData, pdf_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="https://example.com/invoice.pdf"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowRevenueModal(false)}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRevenue}
              disabled={saving || !revenueData.amount}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Revenue'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cost Modal */}
      <Modal
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        title="Add Cost Record"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Title
            </label>
            <input
              type="text"
              value={costData.title}
              onChange={(e) => setCostData({ ...costData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="Enter cost description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Amount (RM)
            </label>
            <input
              type="number"
              step="0.01"
              value={costData.amount}
              onChange={(e) => setCostData({ ...costData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowCostModal(false)}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCost}
              disabled={saving || !costData.title || !costData.amount}
              className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Cost'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}