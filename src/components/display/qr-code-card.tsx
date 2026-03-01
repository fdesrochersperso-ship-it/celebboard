'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode } from 'lucide-react'

type Props = {
  orgId: string
  compact?: boolean
}

export function QrCodeCard({ orgId, compact = false }: Props) {
  const [submitUrl, setSubmitUrl] = useState('')
  useEffect(() => {
    setSubmitUrl(`${window.location.origin}/submit/${orgId}`)
  }, [orgId])

  if (!submitUrl) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">Loading QR...</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-card p-3 shadow-card">
        <div className="rounded-lg bg-white p-2 shadow-inner">
          <QRCodeSVG
            value={submitUrl}
            size={100}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-foreground">
            <QrCode className="size-3 text-primary" />
            Share with Team
          </div>
          <p className="text-xs text-muted-foreground">Scan to post</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <QrCode className="size-5 text-primary" />
        Share with Team
      </h3>
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="rounded-xl bg-white p-4 shadow-inner">
          <QRCodeSVG
            value={submitUrl}
            size={140}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <p className="text-sm text-muted-foreground">Scan to post</p>
      </div>
    </div>
  )
}
