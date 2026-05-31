'use client'

import { useEffect, useState } from 'react'

function Flower({ size = 14, color = '#E8637A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill="#C9A227" />
      {[0,60,120,180,240,300].map(deg => (
        <ellipse key={deg} cx="12" cy="5" rx="2.5" ry="4" fill={color}
          transform={`rotate(${deg} 12 12)`} />
      ))}
    </svg>
  )
}

export default function QRPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    setUrl(appUrl)

    import('qrcode').then(QRCode => {
      QRCode.toDataURL(appUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#FDF6EC' },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl)
    })
  }, [])

  return (
    <div className="bg-pattern min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center">

        {/* Header flowers */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Flower size={16} color="#F4A0B0" />
          <span className="text-white text-lg">★</span>
          <Flower size={20} color="#E8637A" />
          <span className="text-white text-lg">★</span>
          <Flower size={16} color="#F4A0B0" />
        </div>

        <h1 className="heading-font text-5xl md:text-6xl font-bold text-white mb-2" style={{ letterSpacing: '0.04em' }}>
          To the Next 40
        </h1>
        <p className="text-white/80 heading-font italic text-xl mb-2">
          Nicole&apos;s Birthday Predictions
        </p>

        {/* Gold divider */}
        <div className="flex items-center gap-2 mb-8 max-w-xs mx-auto">
          <div className="gold-divider flex-1" />
          <span className="text-[#C9A227] text-sm">★</span>
          <div className="gold-divider flex-1" />
        </div>

        {/* QR Code card */}
        <div className="inline-block rounded-2xl p-6 mb-6" style={{
          background: '#FDF6EC',
          border: '3px solid #C9A227',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" width={260} height={260} />
          ) : (
            <div style={{ width: 260, height: 260 }} className="flex items-center justify-center text-gray-400">
              Generating...
            </div>
          )}

          {/* Flower row below QR */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Flower size={11} color="#E8637A" />
            <span className="text-[#C9A227] text-xs">★</span>
            <Flower size={11} color="#F4A0B0" />
            <span className="text-[#C9A227] text-xs">★</span>
            <Flower size={11} color="#E8637A" />
            <span className="text-[#C9A227] text-xs">★</span>
            <Flower size={11} color="#F4A0B0" />
          </div>
        </div>

        <p className="heading-font text-white text-2xl font-bold mb-1" style={{ letterSpacing: '0.03em' }}>
          Scan to make your predictions
        </p>
        <p className="text-white/50 text-xs font-mono mt-1">{url}</p>

        <div className="mt-6 text-white/40 text-xs">
          ★ Screenshot to use in Canva or print for tables ★
        </div>
      </div>
    </div>
  )
}
