import { motion } from 'framer-motion'
import { Play, Pause, Square } from 'lucide-react'
import { useTimer } from '../../hooks/useTimer'

export default function TimeTracker() {
  const { time, isRunning, start, pause, reset } = useTimer()

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
      className="bg-gradient-to-br from-empire-600 to-gold-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-bright-400/20 to-transparent"></div>
        <div className="absolute top-4 right-4 w-20 h-20 border border-white/10 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border border-white/10 rounded-full"></div>
      </div>

      <div className="relative">
        <h3 className="text-lg font-semibold mb-4">Time Tracker</h3>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold font-mono">{time}</div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={isRunning ? pause : start}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={reset}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}