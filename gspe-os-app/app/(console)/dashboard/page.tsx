"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { MetricCard } from "@/components/console/metric-card"
import { PageHeader } from "@/components/console/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { HEALTH_METRICS } from "@/lib/mock/operations"

const acceptance = HEALTH_METRICS.find((m) => m.id === "hm-accept")!.trend!
const override = HEALTH_METRICS.find((m) => m.id === "hm-override")!.trend!

const trendData = acceptance.map((point, i) => ({
  date: point.date,
  acceptance: point.value,
  override: override[i]?.value ?? 0,
}))

const chartConfig = {
  acceptance: { label: "Acceptance %", color: "var(--chart-1)" },
  override: { label: "Override %", color: "var(--chart-4)" },
} satisfies ChartConfig

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="OS health"
        description="Leading indicators of whether GSPE OS is healthy — behavioural signals, not 'documents complete'. Each metric has an owner and, on a red/yellow breach, an assigned action."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {HEALTH_METRICS.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acceptance vs override</CardTitle>
          <CardDescription>
            Last 7 review points. A rising override rate is an early drift signal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="fillAccept" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-acceptance)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-acceptance)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillOverride" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-override)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-override)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area dataKey="acceptance" type="natural" fill="url(#fillAccept)" stroke="var(--color-acceptance)" />
              <Area dataKey="override" type="natural" fill="url(#fillOverride)" stroke="var(--color-override)" />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
