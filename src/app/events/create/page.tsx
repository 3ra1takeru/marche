"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar, MapPin, Users, Globe, Video, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { prefectures, eventTypes } from "@/lib/constants"

const eventSchema = z.object({
  title: z.string().min(1, "イベント名を入力してください"),
  description: z.string().min(10, "説明は10文字以上で入力してください"),
  location: z.string().min(1, "開催場所を入力してください"),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  startDate: z.string().min(1, "開始日を入力してください"),
  endDate: z.string().min(1, "終了日を入力してください"),
  eventType: z.string().min(1, "イベントタイプを選択してください"),
  maxExhibitors: z.string().min(1, "最大出展者数を入力してください"),
  isOnline: z.boolean(),
  isOnDemand: z.boolean(),
  meetingUrl: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

export default function CreateEventPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      isOnline: false,
      isOnDemand: false,
    },
  })

  const watchIsOnline = watch("isOnline")

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.membershipType !== "PREMIUM") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">プレミアム会員限定</h2>
            <p className="text-gray-600 mb-6">
              イベントを作成するにはプレミアムプランへのアップグレードが必要です
            </p>
            <Link href="/auth/signup?plan=premium">
              <Button>プレミアムプランにアップグレード</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          maxExhibitors: parseInt(data.maxExhibitors),
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "イベントの作成に失敗しました")
      }

      const event = await response.json()
      router.push(`/events/${event.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ダッシュボードに戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新規イベント作成</CardTitle>
          <CardDescription>
            イベントの詳細情報を入力してください
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">
                イベント名 *
              </Label>
              <Input
                id="title"
                placeholder="春のマルシェ2025"
                {...register("title")}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                イベント説明 *
              </Label>
              <Textarea
                id="description"
                placeholder="イベントの詳細な説明を入力してください"
                rows={5}
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  イベントタイプ *
                </Label>
                <Select
                  onValueChange={(value) => setValue("eventType", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.eventType && (
                  <p className="text-sm text-red-600">{errors.eventType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxExhibitors">
                  <Users className="inline w-4 h-4 mr-1" />
                  最大出展者数 *
                </Label>
                <Input
                  id="maxExhibitors"
                  type="number"
                  placeholder="30"
                  {...register("maxExhibitors")}
                  disabled={isLoading}
                />
                {errors.maxExhibitors && (
                  <p className="text-sm text-red-600">{errors.maxExhibitors.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  開催場所 *
                </Label>
                <Input
                  id="location"
                  placeholder="〇〇公園"
                  {...register("location")}
                  disabled={isLoading}
                />
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefecture">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  都道府県 *
                </Label>
                <Select
                  onValueChange={(value) => setValue("prefecture", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.prefecture && (
                  <p className="text-sm text-red-600">{errors.prefecture.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  開始日時 *
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register("startDate")}
                  disabled={isLoading}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  終了日時 *
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register("endDate")}
                  disabled={isLoading}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isOnline" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    オンライン開催
                  </Label>
                  <p className="text-sm text-gray-600">
                    オンラインでも参加可能にする
                  </p>
                </div>
                <Switch
                  id="isOnline"
                  checked={watchIsOnline}
                  onCheckedChange={(checked) => {
                    setValue("isOnline", checked)
                    setIsOnline(checked)
                  }}
                  disabled={isLoading}
                />
              </div>

              {watchIsOnline && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="meetingUrl">
                    <Video className="inline w-4 h-4 mr-1" />
                    ミーティングURL
                  </Label>
                  <Input
                    id="meetingUrl"
                    placeholder="https://zoom.us/..."
                    {...register("meetingUrl")}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isOnDemand">
                    オンデマンド配信
                  </Label>
                  <p className="text-sm text-gray-600">
                    録画を後から視聴可能にする
                  </p>
                </div>
                <Switch
                  id="isOnDemand"
                  {...register("isOnDemand")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  "イベントを作成"
                )}
              </Button>
              <Link href="/dashboard" className="flex-1">
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