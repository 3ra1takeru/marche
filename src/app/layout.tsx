import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "マルシェポータル - イベント出展者マッチングプラットフォーム",
  description: "マルシェやイベントの主催者と出展者を繋ぐポータルサイト",
  manifest: "/manifest.json",
  themeColor: "#e11d48",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}