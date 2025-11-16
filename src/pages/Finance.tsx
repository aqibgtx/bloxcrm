import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Filter, FileText, Calendar, Download, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { formatDate } from '../utils/dateFormat'

interface ProjectFinance {
  id: string
  name: string | null
  target_revenue: number
  client_name: string | null
  client_company: string | null
  total_revenue: number
  total_cost: number
  net_profit: number
  paid_amount: number
  pending_amount: number
  invoices: Array<{
    id: string
    amount: number
    status: string | null
    paid: boolean
    date_issued: string | null
    pdf_url: string | null
  }>
  costs: Array<{
    id: string
    title: string
    amount: number
    created_at: string
  }>
}

interface FinanceStats {
  totalRevenue: number
  totalCost: number
  netProfit: number
  paidAmount: number
  pendingAmount: number
  totalProjects: number
}

export default function Finance() {
  const [projects, setProjects] = useState<ProjectFinance[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectFinance[]>([])
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalProjects: 0
  })
  const [activeFilter, setActiveFilter] = useState('fully_pending')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFinanceData()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, activeFilter, searchQuery])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      
      // Fetch projects with related data (excluding inactive projects)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          target_revenue,
          clients (
            name,
            company
          ),
          invoices (
            id,
            amount,
            status,
            paid,
            date_issued,
            pdf_url
          ),
          project_costs (
            id,
            title,
            amount,
            created_at
          )
        `)
        .neq('status', 'Inactive')
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Process the data
      const processedProjects: ProjectFinance[] = (projectsData || []).map(project => {
        const invoices = project.invoices || []
        const costs = project.project_costs || []

        const total_revenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
        const total_cost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
        const paid_amount = invoices.filter(inv => inv.paid).reduce((sum, inv) => sum + (inv.amount || 0), 0)
        const pending_amount = (project.target_revenue || 0) - paid_amount

        return {
          id: project.id,
          name: project.name,
          target_revenue: project.target_revenue || 0,
          client_name: project.clients?.name || null,
          client_company: project.clients?.company || null,
          total_revenue,
          total_cost,
          net_profit: (project.target_revenue || 0) - total_cost,
          paid_amount,
          pending_amount,
          invoices,
          costs
        }
      })

      setProjects(processedProjects)

      // Calculate overall stats
      const totalRevenue = processedProjects.reduce((sum, p) => sum + p.target_revenue, 0)
      const totalCost = processedProjects.reduce((sum, p) => sum + p.total_cost, 0)
      const paidAmount = processedProjects.reduce((sum, p) => sum + p.total_revenue, 0)
      const pendingAmount = totalRevenue - paidAmount

      setStats({
        totalRevenue,
        totalCost,
        netProfit: totalRevenue - totalCost,
        paidAmount,
        pendingAmount,
        totalProjects: processedProjects.length
      })
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    switch (activeFilter) {
      case 'fully_pending':
        filtered = filtered.filter(p => p.pending_amount > 0)
        break
      case 'fully_paid':
        filtered = filtered.filter(p => p.paid_amount > 0 && p.pending_amount === 0)
        break
      default:
        filtered = projects
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.client_name?.toLowerCase().includes(query) ||
        p.client_company?.toLowerCase().includes(query)
      )
    }

    setFilteredProjects(filtered)
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`
  }

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

  const getProjectStatusColor = (project: ProjectFinance) => {
    if (project.net_profit > 0) return 'text-green-600'
    if (project.net_profit < 0) return 'text-red-600'
    return 'text-gray-600'
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
            <h1 className="text-2xl font-semibold text-gray-800">Finance Overview</h1>
            <p className="text-gray-500">Complete financial tracking across all projects and clients</p>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalCost)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stats.netProfit >= 0 ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  stats.netProfit >= 0 ? 'text-green-600' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className={`text-xl font-bold ${
                  stats.netProfit >= 0 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {formatCurrency(stats.netProfit)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Amount</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-2 shadow-lg mb-8"
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter('fully_pending')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeFilter === 'fully_pending'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pending payments ({projects.filter(p => p.pending_amount > 0).length})
            </button>
            <button
              onClick={() => setActiveFilter('fully_paid')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeFilter === 'fully_paid'
                  ? 'bg-empire-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Fully Paid ({projects.filter(p => p.paid_amount > 0 && p.pending_amount === 0).length})
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by project or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-empire-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Projects Financial Overview */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="space-y-6"
        >
          {filteredProjects.length > 0 ? filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              {/* Project Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-empire-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-empire-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {project.client_name} {project.client_company && `(${project.client_company})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`text-xl font-bold ${getProjectStatusColor(project)}`}>
                      {formatCurrency(project.net_profit)}
                    </p>
                  </div>
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center space-x-2 text-empire-600 hover:bg-empire-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </Link>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {activeFilter === 'fully_pending' ? (
                  <>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium">Target Revenue</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(project.target_revenue)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-yellow-600 font-medium">Pending</p>
                      <p className="text-lg font-bold text-yellow-700">{formatCurrency(project.pending_amount)}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-green-600 font-medium">Paid</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(project.total_revenue)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-red-600 font-medium">Cost</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(project.total_cost)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium">Target Revenue</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(project.target_revenue)}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-green-600 font-medium">Paid</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(project.total_revenue)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-red-600 font-medium">Cost</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(project.total_cost)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-yellow-600 font-medium">Pending</p>
                      <p className="text-lg font-bold text-yellow-700">{formatCurrency(project.pending_amount)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Revenue and Cost Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Records */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>Revenue Records ({project.invoices.length})</span>
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {project.invoices.length > 0 ? project.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{formatCurrency(invoice.amount)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status, invoice.paid)}`}>
                              {invoice.paid ? 'Paid' : invoice.status || 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar size={12} />
                              <span>
                                {invoice.date_issued ? formatDate(invoice.date_issued) : 'No date'}
                              </span>
                            </div>
                            {invoice.pdf_url && (
                              <a
                                href={invoice.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 text-empire-600 hover:text-empire-700"
                              >
                                <Download size={12} />
                                <span>PDF</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center py-4">No revenue records</p>
                    )}
                  </div>
                </div>

                {/* Cost Records */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span>Cost Records ({project.costs.length})</span>
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {project.costs.length > 0 ? project.costs.map((cost) => (
                      <div key={cost.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{cost.title}</span>
                            <span className="font-medium text-red-600">{formatCurrency(cost.amount)}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Added on {formatDate(cost.created_at)}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center py-4">No cost records</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No projects found</h3>
              <p className="text-gray-500">
                {activeFilter === 'fully_pending' 
                  ? 'No projects with pending payments'
                  : activeFilter === 'fully_paid'
                  ? 'No fully paid projects found'
                  : 'No projects with financial data available'
                }
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}