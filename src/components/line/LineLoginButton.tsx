"use client"

import { Button } from "@/components/ui/button"
import { useLiff } from "@/hooks/useLiff"
import { MessageCircle, Share2 } from "lucide-react"
import { useState } from "react"

interface LineLoginButtonProps {
  onProfileReceived?: (profile: any) => void
}

export function LineLoginButton({ onProfileReceived }: LineLoginButtonProps) {
  const { liffProfile, isLiffReady, isInLiff, loginWithLine, logoutFromLine } = useLiff()
  const [isLoading, setIsLoading] = useState(false)

  const handleLineLogin = async () => {
    setIsLoading(true)
    try {
      if (liffProfile) {
        logoutFromLine()
      } else {
        loginWithLine()
        if (liffProfile && onProfileReceived) {
          onProfileReceived(liffProfile)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLiffReady) {
    return (
      <Button disabled variant="outline" className="w-full">
        <MessageCircle className="mr-2 h-4 w-4" />
        LINE連携準備中...
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleLineLogin}
        disabled={isLoading}
        variant={liffProfile ? "destructive" : "default"}
        className={`w-full ${
          !liffProfile ? "bg-[#00B900] hover:bg-[#00A000] text-white" : ""
        }`}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        {liffProfile ? "LINEログアウト" : "LINEでログイン"}
      </Button>

      {liffProfile && (
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-3">
            {liffProfile.pictureUrl && (
              <img
                src={liffProfile.pictureUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-sm">{liffProfile.displayName}</p>
              <p className="text-xs text-green-600">LINEアカウント連携済み</p>
            </div>
          </div>
        </div>
      )}

      {isInLiff && (
        <p className="text-xs text-center text-gray-500">
          LINE内でアプリを実行中
        </p>
      )}
    </div>
  )
}