import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Farm Tracker',
  description: 'Modern goat tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}