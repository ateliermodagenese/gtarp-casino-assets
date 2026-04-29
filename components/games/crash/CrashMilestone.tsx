"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CrashMilestoneProps {
  milestone: number | null
}

const MILESTONE_COLORS: Record<number, string> = {
  2: "#00E676",
  5: "#FFD700",
  10: "#FF9800",
  25: "#FF4444",
  50: "#FF1744",
  100: "#AA00FF",
}

function getMilestoneColor(milestone: number): string {
  return MILESTONE_COLORS[milestone] || "#FFD700"
}

export default function CrashMilestone({ milestone }: CrashMilestoneProps) {
  const [visibleMilestone, setVisibleMilestone] = useState<number | null>(null)

  useEffect(() => {
    if (milestone !== null) {
      setVisibleMilestone(milestone)

      const timer = setTimeout(() => {
        setVisibleMilestone(null)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [milestone])

  const color = visibleMilestone ? getMilestoneColor(visibleMilestone) : "#FFD700"

  return (
    <AnimatePresence mode="wait">
      {visibleMilestone !== null && (
        <motion.div
          key={visibleMilestone}
          initial={{ opacity: 0, scale: 0.5, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20,
          }}
          style={{
            position: "absolute",
            top: "clamp(12px, 2vw, 20px)",
            right: "clamp(12px, 2vw, 20px)",
            zIndex: 50,
            background: `${color}26`,
            border: `1.5px solid ${color}66`,
            borderRadius: "8px",
            padding: "4px 12px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "clamp(14px, 2vw, 22px)",
              color: color,
              textShadow: `0 0 12px ${color}80, 0 0 24px ${color}40`,
              letterSpacing: "-0.5px",
            }}
          >
            {visibleMilestone}x
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
