import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getLocalDateString } from '../../utils/dateFormat'

interface ProjectAnalyticsProps {
  onLoaded?: () => void
  data?: any
}

export default function ProjectAnalytics({ onLoaded, data: propData }: ProjectAnalyticsProps) {
  const [data, setData] = useState<{ day: string; value: number }[]>([])
  const [selectedBar, setSelectedBar] = useState<number | null>(null)

  useEffect(() => {
    if (propData) {
      setData(propData)
      if (onLoaded) onLoaded()
    } else {
      fetchWeeklyOutreaches()
    }
  }, [propData])

  const fetchWeeklyOutreaches = async () => {
    try {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - dayOfWeek)

      const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      const weekData = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateStr = getLocalDateString(date)

        const { data: tasks } = await supabase
          .from('daily_tasks')
          .select('title, completed')
          .eq('date', dateStr)
          .eq('completed', true)

        let outreaches = 0
        tasks?.forEach(task => {
          const match = task.title.match(/(?:ot|outreach)\s*(\d+)/i)
          if (match) outreaches += parseInt(match[1])
        })

        weekData.push({ day: weekDays[i], value: outreaches })
      }

      setData(weekData)
      if (onLoaded) onLoaded()
    } catch (error) {
      console.error('Error fetching weekly outreaches:', error)
      if (onLoaded) onLoaded()
    }
  }

  const handleBarClick = (data: any, index: number) => {
    setSelectedBar(index)
  }

  const getDayName = (dayInitial: string) => {
    const days: { [key: string]: string } = {
      'S': 'Sunday',
      'M': 'Monday',
      'T': 'Tuesday',
      'W': 'Wednesday',
      'F': 'Friday'
    }
    return days[dayInitial] || dayInitial
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Weekly Outreach Volume</h3>
        {selectedBar !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold"
          >
            {getDayName(data[selectedBar]?.day)}: {data[selectedBar]?.value} outreaches
          </motion.div>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%" onClick={(e) => {
            if (e && e.activeTooltipIndex !== undefined) {
              handleBarClick(e.activePayload?.[0]?.payload, e.activeTooltipIndex)
            }
          }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              className="text-gray-400 text-sm"
            />
            <YAxis hide />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="#f59e0b"
                  className="transition-colors duration-200"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}