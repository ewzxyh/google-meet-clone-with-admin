import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Meet VideoZapp",
  description: "Reuniões com vídeo",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="[REDACTED_BASIC_AUTH_URL]" />
        <link rel="preload" href="[REDACTED_BASIC_AUTH_URL]" as="style" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>{children}</body>
    </html>
  )
}
