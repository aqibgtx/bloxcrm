import { motion } from 'framer-motion'
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getLocalDateString } from '../../utils/dateFormat'

interface StatsData {
  totalProjects: number
  endedProjects: string
  runningProjects: number
  interestedLeads: number
  pendingProjects: string
  totalOutreaches: number
}

interface StatsCardsProps {
  onLoaded?: () => void
  data?: any
  isReady?: boolean
}

export default function StatsCards({ onLoaded, data, isReady = true }: StatsCardsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalProjects: 0,
    endedProjects: 'RM 0',
    runningProjects: 0,
    interestedLeads: 0,
    pendingProjects: '0 outreaches',
    totalOutreaches: 0
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (data && selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      setStats({
        totalProjects: data.totalProjects || 0,
        endedProjects: `RM ${(data.totalRevenue || 0).toLocaleString()}`,
        runningProjects: data.convertedLeads || 0,
        interestedLeads: data.interestedLeads || 0,
        pendingProjects: `${data.monthlyOutreaches || 0} outreaches ${monthNames[selectedMonth]}`,
        totalOutreaches: data.totalOutreaches || 0
      })
      if (onLoaded) onLoaded()
    } else {
      fetchStats()
    }
  }, [data, selectedMonth, selectedYear])

  const fetchStats = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1)
      const endDate = new Date(selectedYear, selectedMonth + 1, 0)
      const startStr = getLocalDateString(startDate)
      const endStr = getLocalDateString(endDate)

      // Total Projects for current month
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .gte('created_at', startStr)
        .lte('created_at', endStr)

      // Ended Projects - total revenue this month
      const { data: endedProjects } = await supabase
        .from('projects')
        .select('target_revenue')
        .neq('status', 'Inactive')
        .gte('created_at', startStr)
        .lte('created_at', endStr)

      const totalRevenue = endedProjects?.reduce((sum, p) => sum + (Number(p.target_revenue) || 0), 0) || 0

      // Running Projects - converted leads (status changed to Active this month)
      const { data: clients } = await supabase.from('clients').select('status, created_at')
      const convertedLeads = clients?.filter(c => c.status === 'converted').length || 0
      const interestedLeads = clients?.filter(c => c.status === 'interested').length || 0

      // Pending Projects - outreach count from tasks under goals created in selected month
      let currentMonthOutreaches = 0
      let totalOutreaches = 0

      const parseOutreach = (title: string) => {
        const match = title.match(/(?:ot|outreach)\s*(\d+)/i)
        return match ? parseInt(match[1]) : 0
      }

      // Get monthly goals created in selected month
      const { data: monthlyGoals } = await supabase
        .from('goals')
        .select('id')
        .eq('type', 'monthly')
        .gte('created_at', startStr)
        .lte('created_at', endStr)

      // Get all completed tasks under these monthly goals
      if (monthlyGoals && monthlyGoals.length > 0) {
        const goalIds = monthlyGoals.map(g => g.id)

        const { data: tasks } = await supabase
          .from('daily_tasks')
          .select('title, completed')
          .in('goal_id', goalIds)
          .eq('completed', true)

        tasks?.forEach(task => {
          currentMonthOutreaches += parseOutreach(task.title)
        })
      }

      // Get all monthly goals so total outreaches covers every month's outreach tasks
      const { data: allMonthlyGoals } = await supabase
        .from('goals')
        .select('id')
        .eq('type', 'monthly')

      if (allMonthlyGoals && allMonthlyGoals.length > 0) {
        const allGoalIds = allMonthlyGoals.map(g => g.id)
        const { data: allMonthlyTasks } = await supabase
          .from('daily_tasks')
          .select('title, completed')
          .in('goal_id', allGoalIds)
          .eq('completed', true)

        allMonthlyTasks?.forEach(task => {
          totalOutreaches += parseOutreach(task.title)
        })
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      setStats({
        totalProjects: projects?.length || 0,
        endedProjects: `RM ${totalRevenue.toLocaleString()}`,
        runningProjects: convertedLeads,
        interestedLeads,
        pendingProjects: `${currentMonthOutreaches} outreaches ${monthNames[selectedMonth]}`,
        totalOutreaches
      })

      if (onLoaded) onLoaded()
    } catch (error) {
      console.error('Error fetching stats:', error)
      if (onLoaded) onLoaded()
    }
  }

  const cards = [
    {
      title: 'Monthly Projects',
      value: stats.totalProjects,
      bgColor: 'bg-gradient-to-br from-empire-600 to-gold-600',
      textColor: 'text-white',
      subtext: null
    },
    {
      title: 'Revenue This Month',
      value: stats.endedProjects,
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      subtext: null
    },
    {
      title: 'Converted Leads',
      value: stats.runningProjects,
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
      subtext: `${stats.interestedLeads} interested leads`
    },
    {
      title: 'Monthly Outreach',
      value: stats.pendingProjects,
      bgColor: 'bg-white',
      textColor: 'text-gray-800',
        
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ y: 60, opacity: 0 }}
          animate={isReady ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
          transition={{ duration: 0.5, delay: isReady ? index * 0.1 : 0, ease: "easeOut" }}
          className={`${card.bgColor} rounded-2xl p-6 relative overflow-hidden shadow-lg`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className={`text-sm font-medium ${card.textColor} opacity-75`}>{card.title}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-3xl font-bold ${card.textColor}`}>{card.value}</span>
                <ArrowUpRight className={`w-5 h-5 ${card.textColor} opacity-50`} />
              </div>
              {card.subtext && (
                <p className={`text-xs ${card.textColor} opacity-60 mt-2`}>{card.subtext}</p>
              )}
              {card.hasFilter && (
                <div className="flex items-center space-x-2 mt-3">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700"
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
