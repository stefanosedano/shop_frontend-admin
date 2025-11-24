'use client'

import './globals.css'
import { LanguageProvider } from '../context/LanguageContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <title>Shop Admin Dashboard</title>
      </head>
      <body className="bg-ui-bg-subtle">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
