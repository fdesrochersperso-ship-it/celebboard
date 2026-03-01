'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import { CheckCircle, TrendingUp } from 'lucide-react'

export type ChartDataPoint = {
  week: string
  count: number
  [key: string]: string | number
}

const MOCK_DATA: ChartDataPoint[] = [
  { week: 'Week 1', count: 42 },
  { week: 'Week 2', count: 58 },
  { week: 'Week 3', count: 35 },
  { week: 'Week 4', count: 71 },
  { week: 'Week 5', count: 49 },
  { week: 'Week 6', count: 63 },
]

type Props = {
  title?: string
  data?: ChartDataPoint[]
  dataKey?: string
  color?: string
  isLoading?: boolean
}

export function KpiChart({
  title = 'New Subscribers by Week',
  data,
  dataKey = 'count',
  color = 'var(--success)',
  isLoading = false,
}: Props) {
  const chartData = (data && data.length > 0 ? data : MOCK_DATA)
  const total = chartData.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="flex items-center gap-2 pb-2">
        <div className="flex items-center justify-center rounded-lg bg-success/10 p-2">
          <CheckCircle className="size-5 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Total: {total.toLocaleString()} since Dec 1
            <TrendingUp className="size-4 text-success" />
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1" style={{ minHeight: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="week"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={30}
            />
            <Bar
              dataKey={dataKey}
              fill="url(#chartGradient)"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
            >
              <LabelList
                dataKey={dataKey}
                position="top"
                fill="hsl(var(--foreground))"
                fontSize={13}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
