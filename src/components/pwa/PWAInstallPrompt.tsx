"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // iOS判定
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // beforeinstallpromptイベントリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    // 既にインストール済みかチェック
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true

    if (!isInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installed')
      }
      
      setDeferredPrompt(null)
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setDeferredPrompt(null)
  }

  // インストールプロンプトが表示可能な場合のみ表示
  if (!isVisible && !isIOS) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">アプリをインストール</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            マルシェポータルをアプリとしてインストールしてより便利に使いましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                iOSでアプリをインストールするには：
              </p>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. Safari の共有ボタン (📤) をタップ</li>
                <li>2. 「ホーム画面に追加」を選択</li>
                <li>3. 「追加」をタップ</li>
              </ol>
            </div>
          ) : (
            <Button onClick={handleInstallClick} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              インストール
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}