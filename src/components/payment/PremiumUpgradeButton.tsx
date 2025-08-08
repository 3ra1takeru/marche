"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Crown } from "lucide-react"
import getStripe from "@/lib/stripe"

interface PremiumUpgradeButtonProps {
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline"
}

export function PremiumUpgradeButton({
  className = "",
  size = "default",
  variant = "default"
}: PremiumUpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "subscription",
          planType: "premium",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = await response.json()
      const stripe = await getStripe()

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error("Upgrade error:", error)
      alert("アップグレード処理に失敗しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      size={size}
      variant={variant}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          処理中...
        </>
      ) : (
        <>
          <Crown className="mr-2 h-4 w-4" />
          プレミアムにアップグレード
        </>
      )}
    </Button>
  )
}