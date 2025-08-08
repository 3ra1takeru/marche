"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelledPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
          <CardTitle className="text-2xl text-orange-600">
            決済がキャンセルされました
          </CardTitle>
          <CardDescription>
            決済処理がキャンセルされました。いつでも再度お試しいただけます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-700">
              決済が完了していないため、サービスはまだ有効になっていません。
              ご不明な点がございましたら、サポートまでお問い合わせください。
            </p>
          </div>

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