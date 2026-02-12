"use client"

import { useState, useMemo } from "react"
import type { DailyCompletions } from "@/lib/types"

interface ContributionGraphProps {
  data: DailyCompletions
}

const CELL_SIZE = 11
const GAP = 2
const WEEKS = 53
const DAYS = 7

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]

function getIntensity(count: number): number {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

const INTENSITY_CLASSES = [
  "bg-muted",
  "bg-green-300 dark:bg-green-800",
  "bg-green-400 dark:bg-green-700",
  "bg-green-500 dark:bg-green-600",
  "bg-green-600 dark:bg-green-500",
]

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ContributionGraph({ data }: ContributionGraphProps) {
  const [tooltip, setTooltip] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  const { grid, monthLabels, totalCount } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the last Saturday (end of the rightmost column)
    const end = new Date(today)
    end.setDate(end.getDate() + (6 - end.getDay()))

    // Go back 52 weeks from end to get start (Sunday)
    const start = new Date(end)
    start.setDate(start.getDate() - (WEEKS - 1) * 7 - 6)

    const cells: { date: Date; count: number; col: number; row: number }[] = []
    const months: { label: string; col: number }[] = []
    let total = 0
    let lastMonth = -1

    const current = new Date(start)
    for (let week = 0; week < WEEKS; week++) {
      for (let day = 0; day < DAYS; day++) {
        if (current > today) {
          current.setDate(current.getDate() + 1)
          continue
        }
        const dateStr = current.toISOString().slice(0, 10)
        const count = data[dateStr] || 0
        total += count

        cells.push({
          date: new Date(current),
          count,
          col: week,
          row: day,
        })

        const month = current.getMonth()
        if (month !== lastMonth) {
          months.push({ label: MONTH_LABELS[month], col: week })
          lastMonth = month
        }

        current.setDate(current.getDate() + 1)
      }
    }

    return { grid: cells, monthLabels: months, totalCount: total }
  }, [data])

  const graphWidth = WEEKS * (CELL_SIZE + GAP) - GAP
  const LABEL_WIDTH = 30
  const MONTH_LABEL_HEIGHT = 16

  return (
    <div className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">
        {totalCount} video{totalCount !== 1 ? "s" : ""} completed in the last year
      </p>

      <div className="overflow-x-auto rounded-lg border bg-card p-3">
        <div
          className="relative"
          style={{ width: graphWidth + LABEL_WIDTH, minHeight: DAYS * (CELL_SIZE + GAP) - GAP + MONTH_LABEL_HEIGHT }}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <span
              key={`${m.label}-${i}`}
              className="absolute text-[10px] text-muted-foreground"
              style={{
                left: LABEL_WIDTH + m.col * (CELL_SIZE + GAP),
                top: 0,
              }}
            >
              {m.label}
            </span>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <span
                key={label}
                className="absolute text-[10px] text-muted-foreground"
                style={{
                  left: 0,
                  top: MONTH_LABEL_HEIGHT + i * (CELL_SIZE + GAP) + 1,
                }}
              >
                {label}
              </span>
            ) : null
          )}

          {/* Grid cells */}
          {grid.map((cell) => {
            const intensity = getIntensity(cell.count)
            const x = LABEL_WIDTH + cell.col * (CELL_SIZE + GAP)
            const y = MONTH_LABEL_HEIGHT + cell.row * (CELL_SIZE + GAP)

            return (
              <div
                key={`${cell.col}-${cell.row}`}
                className={`absolute rounded-sm ${INTENSITY_CLASSES[intensity]} cursor-pointer`}
                style={{
                  left: x,
                  top: y,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const parent = e.currentTarget.closest(".relative")?.getBoundingClientRect()
                  if (parent) {
                    setTooltip({
                      text: `${cell.count} video${cell.count !== 1 ? "s" : ""} completed — ${formatDate(cell.date)}`,
                      x: rect.left - parent.left + CELL_SIZE / 2,
                      y: rect.top - parent.top - 8,
                    })
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-10 pointer-events-none px-2 py-1 text-xs rounded bg-popover text-popover-foreground border shadow-md whitespace-nowrap"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              {tooltip.text}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <span
            key={i}
            className={`inline-block rounded-sm ${cls}`}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
