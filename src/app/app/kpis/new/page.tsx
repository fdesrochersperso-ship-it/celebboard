'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiForm } from '@/components/admin/kpi-builder/kpi-form'

export default function NewKpiPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/kpis">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New KPI</h1>
          <p className="text-muted-foreground">
            Configure a live metric for your TV dashboard
          </p>
        </div>
      </div>

      <KpiForm />
    </div>
  )
}
