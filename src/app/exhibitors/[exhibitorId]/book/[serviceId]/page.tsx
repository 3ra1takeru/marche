"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, CreditCard, Banknote, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { format, addMinutes, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

const bookingSchema = z.object({
  startTime: z.string().min(1, "開始時間を選択してください"),
  paymentMethod: z.enum(["CREDIT_CARD", "ONSITE"], {
    required_error: "支払い方法を選択してください",
  }),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function ServiceBookingPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [exhibitor, setExhibitor] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  const watchPaymentMethod = watch("paymentMethod")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (params.exhibitorId && params.serviceId) {
      fetchData()
    }
  }, [params.exhibitorId, params.serviceId])

  const fetchData = async () => {
    try {
      const exhibitorResponse = await fetch(`/api/exhibitors/${params.exhibitorId}`)
      if (exhibitorResponse.ok) {
        const exhibitorData = await exhibitorResponse.json()
        setExhibitor(exhibitorData)
        
        const serviceData = exhibitorData.services?.find(
          (s: any) => s.id === params.serviceId
        )
        setService(serviceData)

        if (serviceData) {
          await fetchAvailableSlots(exhibitorData.eventId, serviceData)
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      setError("データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async (eventId: string, serviceData: any) => {
    try {
      const response = await fetch(`/api/events/${eventId}/available-slots?serviceId=${params.serviceId}`)
      if (response.ok) {
        const slots = await response.json()
        setAvailableSlots(slots)
      }
    } catch (error) {
      console.error("Failed to fetch available slots:", error)
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!service || !exhibitor) return

    setIsSubmitting(true)
    setError("")

    try {
      const startTime = new Date(data.startTime)
      const endTime = addMinutes(startTime, service.duration)

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: exhibitor.eventId,
          exhibitorId: params.exhibitorId,
          serviceId: params.serviceId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          paymentMethod: data.paymentMethod,
          totalAmount: service.price,
          notes: data.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "予約に失敗しました")
      }

      const booking = await response.json()

      if (data.paymentMethod === "CREDIT_CARD") {
        // Stripe決済に進む
        const checkoutResponse = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "booking",
            bookingId: booking.id,
          }),
        })

        if (checkoutResponse.ok) {
          const { sessionId } = await checkoutResponse.json()
          // Stripeにリダイレクト
          const stripe = await import("@/lib/stripe").then(m => m.default())
          if (stripe) {
            await stripe.redirectToCheckout({ sessionId })
          }
        }
      } else {
        // 現地決済の場合はダッシュボードに戻る
        router.push("/dashboard?booking=success")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (!exhibitor || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">サービスが見つかりません</h2>
            <Link href="/events">
              <Button>イベント一覧に戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/exhibitors/${params.exhibitorId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          出展者詳細に戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>サービス予約</CardTitle>
          <CardDescription>
            {exhibitor.businessName || exhibitor.name} の {service.name}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* サービス情報 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{service.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{service.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.duration}分
                </span>
                <span className="font-semibold text-lg">
                  ¥{service.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 時間選択 */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                <Calendar className="inline w-4 h-4 mr-1" />
                予約時間 *
              </Label>
              <Select onValueChange={(value) => setValue("startTime", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="時間を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.length === 0 ? (
                    <SelectItem value="no-slots" disabled>
                      利用可能な時間がありません
                    </SelectItem>
                  ) : (
                    availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {format(parseISO(slot), "MM月dd日 HH:mm", { locale: ja })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.startTime && (
                <p className="text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            {/* 支払い方法 */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                支払い方法 *
              </Label>
              <Select onValueChange={(value: "CREDIT_CARD" | "ONSITE") => setValue("paymentMethod", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="支払い方法を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT_CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      クレジットカード決済
                    </div>
                  </SelectItem>
                  <SelectItem value="ONSITE">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      当日現地決済
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>

            {watchPaymentMethod === "CREDIT_CARD" && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  クレジットカード決済を選択すると、Stripeの安全な決済ページに移動します。
                </p>
              </div>
            )}

            {watchPaymentMethod === "ONSITE" && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-700">
                  当日、サービス提供時に現金でお支払いください。
                </p>
              </div>
            )}

            {/* 備考 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備考（任意）</Label>
              <Textarea
                id="notes"
                placeholder="ご要望やご質問があればご記入ください"
                {...register("notes")}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || availableSlots.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    予約中...
                  </>
                ) : (
                  "予約を確定"
                )}
              </Button>
              <Link href={`/exhibitors/${params.exhibitorId}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  キャンセル
                </Button>
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}