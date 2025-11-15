import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StatsCards from '../components/dashboard/StatsCards'
import ProjectAnalytics from '../components/dashboard/ProjectAnalytics'
import TeamCollaboration from '../components/dashboard/TeamCollaboration'
import Reminders from '../components/dashboard/Reminders'
import ProjectProgress from '../components/dashboard/ProjectProgress'
import ProjectList from '../components/dashboard/ProjectList'
import TimeTracker from '../components/dashboard/TimeTracker'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data, error } = await supabase.rpc('get_dashboard_data', {
        p_month: currentMonth,
        p_year: currentYear
      })

      if (error) throw error
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
      <div>
        <StatsCards data={dashboardData?.stats} isReady={!loading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ProjectAnalytics data={dashboardData?.weeklyOutreaches} />
          </div>
          <div>
            <Reminders data={dashboardData?.reminders} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <TeamCollaboration data={dashboardData?.todaysTasks} />
          </div>
          <div className="lg:col-span-1">
            <ProjectProgress data={dashboardData?.projectProgress} />
          </div>
          <div className="lg:col-span-2">
            <ProjectList data={dashboardData?.monthlyProjects} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1">
            <TimeTracker />
          </div>
        </div>
      </div>
    </div>
  )
}