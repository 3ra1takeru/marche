"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    
    if (sessionId) {
      verifyPayment(sessionId)
    } else {
      setError("セッションIDが見つかりません")
      setLoading(false)
    }
  }, [searchParams])

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/verify-payment?session_id=${sessionId}`)
      
      if (response.ok) {
        const data = await response.json()
        setSessionData(data)
      } else {
        setError("決済の確認に失敗しました")
      }
    } catch (error) {
      setError("決済の確認中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">決済を確認中...</h2>
            <p className="text-gray-600">
              しばらくお待ちください
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/dashboard">
              <Button>ダッシュボードに戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl text-green-600">
            決済が完了しました！
          </CardTitle>
          <CardDescription>
            ありがとうございます。決済が正常に処理されました。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionData && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">決済ID:</span>
                <span className="text-sm font-mono">{sessionData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">金額:</span>
                <span className="text-sm font-semibold">
                  ¥{((sessionData.amount_total || 0) / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">決済日時:</span>
                <span className="text-sm">
                  {sessionData.created && new Date(sessionData.created * 1000).toLocaleString('ja-JP')}
                </span>
              </div>
            </div>
          )}

          {sessionData?.metadata?.type === "subscription" && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                プレミアムプランにアップグレードしました！
              </h3>
              <p className="text-sm text-green-700">
                2ヶ月の無料期間が開始されました。無制限のイベント作成をお楽しみください。
              </p>
            </div>
          )}

          {sessionData?.metadata?.type === "booking" && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                予約が確定しました！
              </h3>
              <p className="text-sm text-blue-700">
                予約の詳細については、ダッシュボードでご確認ください。
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                ダッシュボード
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                ホーム
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}