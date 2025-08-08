"use client"

import { Button } from "@/components/ui/button"
import { useLiff } from "@/hooks/useLiff"
import { Share2, MessageCircle } from "lucide-react"
import { useState } from "react"

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

export function ShareButton({ 
  url, 
  title, 
  description, 
  size = "default", 
  variant = "outline" 
}: ShareButtonProps) {
  const { isLiffReady, isInLiff, shareContent } = useLiff()
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const success = await shareContent(url, title, description)
      if (success) {
        // 共有成功の処理
        console.log('Content shared successfully')
      } else {
        // フォールバック: Web Share API または通常の共有
        if (navigator.share) {
          await navigator.share({
            title,
            text: description,
            url,
          })
        } else {
          // URLをクリップボードにコピー
          await navigator.clipboard.writeText(url)
          alert('URLをクリップボードにコピーしました')
        }
      }
    } catch (error) {
      console.error('Share failed:', error)
      // フォールバック処理
      try {
        await navigator.clipboard.writeText(url)
        alert('URLをクリップボードにコピーしました')
      } catch {
        alert('共有に失敗しました')
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      size={size}
      variant={variant}
    >
      {isLiffReady && isInLiff ? (
        <MessageCircle className="mr-2 h-4 w-4" />
      ) : (
        <Share2 className="mr-2 h-4 w-4" />
      )}
      {isSharing ? "共有中..." : "共有"}
    </Button>
  )
}