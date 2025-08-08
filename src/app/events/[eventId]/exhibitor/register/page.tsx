"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { User, Building, MessageSquare, Tag, Clock, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { exhibitorCategories } from "@/lib/constants"

const exhibitorSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  businessName: z.string().optional(),
  introduction: z.string().min(10, "紹介文は10文字以上で入力してください"),
  category: z.string().min(1, "出展ジャンルを選択してください"),
  snsLinks: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    website: z.string().optional(),
  }),
  serviceTime: z.string().optional(),
  intervalTime: z.string().optional(),
  hasServices: z.boolean(),
})

type ExhibitorFormData = z.infer<typeof exhibitorSchema>

export default function ExhibitorRegisterPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [event, setEvent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasServices, setHasServices] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExhibitorFormData>({
    resolver: zodResolver(exhibitorSchema),
    defaultValues: {
      hasServices: false,
      snsLinks: {
        instagram: "",
        twitter: "",
        website: "",
      },
    },
  })

  const watchHasServices = watch("hasServices")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (params.eventId) {
      fetchEvent()
    }
  }, [params.eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const onSubmit = async (data: ExhibitorFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/events/${params.eventId}/exhibitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          serviceTime: data.serviceTime ? parseInt(data.serviceTime) : null,
          intervalTime: data.intervalTime ? parseInt(data.intervalTime) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "出展申込に失敗しました")
      }

      router.push(`/events/${params.eventId}?registered=true`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/events/${params.eventId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          イベント詳細に戻る
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>出展者登録</CardTitle>
          <CardDescription>
            {event?.title} への出展申込を行います
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
              <Label htmlFor="name">
                <User className="inline w-4 h-4 mr-1" />
                お名前 *
              </Label>
              <Input
                id="name"
                placeholder="山田太郎"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">
                <Building className="inline w-4 h-4 mr-1" />
                屋号・ブランド名
              </Label>
              <Input
                id="businessName"
                placeholder="〇〇工房"
                {...register("businessName")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                <Tag className="inline w-4 h-4 mr-1" />
                出展ジャンル *
              </Label>
              <Select
                onValueChange={(value) => setValue("category", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {exhibitorCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="introduction">
                <MessageSquare className="inline w-4 h-4 mr-1" />
                紹介文 *
              </Label>
              <Textarea
                id="introduction"
                placeholder="あなたの活動や商品について詳しく教えてください"
                rows={5}
                {...register("introduction")}
                disabled={isLoading}
              />
              {errors.introduction && (
                <p className="text-sm text-red-600">{errors.introduction.message}</p>
              )}
            </div>

            {/* SNSリンク */}
            <div className="space-y-4">
              <Label>SNSリンク（任意）</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm">
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="@username"
                    {...register("snsLinks.instagram")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-sm">
                    Twitter/X
                  </Label>
                  <Input
                    id="twitter"
                    placeholder="@username"
                    {...register("snsLinks.twitter")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm">
                    ウェブサイト
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://..."
                    {...register("snsLinks.website")}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* サービス提供設定 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasServices">
                    <Clock className="inline w-4 h-4 mr-1" />
                    時間制サービスを提供
                  </Label>
                  <p className="text-sm text-gray-600">
                    占いやマッサージなど、時間を区切ったサービスを提供する場合
                  </p>
                </div>
                <Switch
                  id="hasServices"
                  checked={watchHasServices}
                  onCheckedChange={(checked) => {
                    setValue("hasServices", checked)
                    setHasServices(checked)
                  }}
                  disabled={isLoading}
                />
              </div>

              {watchHasServices && (
                <div className="pl-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceTime">
                        サービス時間（分）
                      </Label>
                      <Input
                        id="serviceTime"
                        type="number"
                        placeholder="30"
                        {...register("serviceTime")}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intervalTime">
                        インターバル時間（分）
                      </Label>
                      <Input
                        id="intervalTime"
                        type="number"
                        placeholder="10"
                        {...register("intervalTime")}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    申込中...
                  </>
                ) : (
                  "出展申込を送信"
                )}
              </Button>
              <Link href={`/events/${params.eventId}`} className="flex-1">
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