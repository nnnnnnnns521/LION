'use client'

import { useEffect, useRef, useState } from 'react'

export default function QRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: '#F72585' }}
    >
      <div className="text-center">
        <div className="text-white/80 text-3xl mb-4 tracking-widest">❀ ★ ❀</div>

        <h1
          className="heading-font text-4xl md:text-5xl font-bold text-white mb-2"
          style={{ letterSpacing: '0.04em' }}
        >
          To the Next 40
        </h1>
        <p className="text-white/80 heading-font italic text-xl mb-8">
          Nicole&apos;s Birthday Predictions
        </p>

        <div
          className="inline-block rounded-2xl overflow-hidden p-4 mb-8"
          style={{
            background: '#FDF6EC',
            border: '3px solid #C9A227',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" width={280} height={280} />
          ) : (
            <div
              style={{ width: 280, height: 280 }}
              className="flex items-center justify-center text-gray-400"
            >
              Generating...
            </div>
          )}
        </div>

        <p
          className="text-white text-2xl font-bold mb-2"
          style={{ letterSpacing: '0.05em' }}
        >
          Scan to make your predictions
        </p>
        <p className="text-white/60 text-sm font-mono">{url}</p>

        <div className="mt-8 text-white/50 text-sm">
          ★ Screenshot this page to use in Canva or print for tables ★
        </div>
      </div>
    </div>
  )
}
