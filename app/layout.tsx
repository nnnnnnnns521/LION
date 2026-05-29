import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "To the Next 40 — Nicole's Birthday Predictions",
  description: "Make your predictions for Nicole's 40th birthday party!",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
