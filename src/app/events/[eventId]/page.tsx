"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Globe, Clock, Star, ShoppingBag, User, Link as LinkIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export default function EventDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

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
        setIsOwner(session?.user?.id === data.userId)
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">イベントが見つかりません</h2>
            <Link href="/events">
              <Button>イベント一覧に戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventTypeLabel = {
    MARCHE: "マルシェ",
    FESTIVAL: "フェスティバル",
    WORKSHOP: "ワークショップ",
    EXHIBITION: "展示会",
    OTHER: "その他",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {eventTypeLabel[event.eventType as keyof typeof eventTypeLabel]}
              </Badge>
              {event.isOnline && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Globe className="mr-1 h-3 w-3" />
                  オンライン
                </Badge>
              )}
              {event.status === "PUBLISHED" && (
                <Badge variant="secondary" className="bg-green-500/20 text-white border-green-300/30">
                  公開中
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.startDate), "yyyy年MM月dd日 HH:mm", { locale: ja })}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.prefecture} - {event.location}
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                主催: {event.user?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>イベント詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>

            {/* タブコンテンツ */}
            <Tabs defaultValue="exhibitors" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="exhibitors">出展者情報</TabsTrigger>
                <TabsTrigger value="schedule">スケジュール</TabsTrigger>
              </TabsList>

              <TabsContent value="exhibitors" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    出展者一覧 ({event.exhibitors?.length || 0} / {event.maxExhibitors})
                  </h3>
                  {session && event.exhibitors?.length < event.maxExhibitors && (
                    <Link href={`/events/${event.id}/exhibitor/register`}>
                      <Button>
                        <Users className="mr-2 h-4 w-4" />
                        出展申込
                      </Button>
                    </Link>
                  )}
                </div>

                {event.exhibitors?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">まだ出展者の登録がありません</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {event.exhibitors?.map((exhibitor: any) => (
                      <Card key={exhibitor.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {exhibitor.businessName || exhibitor.name}
                              </CardTitle>
                              <CardDescription>
                                <Badge variant="outline" className="mt-2">
                                  {exhibitor.category}
                                </Badge>
                              </CardDescription>
                            </div>
                            <Link href={`/exhibitors/${exhibitor.id}`}>
                              <Button variant="ghost" size="sm">
                                詳細を見る
                              </Button>
                            </Link>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            {exhibitor.introduction}
                          </p>
                          {exhibitor.products?.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <ShoppingBag className="h-4 w-4" />
                              商品数: {exhibitor.products.length}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>タイムスケジュール</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">開始時間</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(event.startDate), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">終了時間</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(event.endDate), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 申込カード */}
            <Card>
              <CardHeader>
                <CardTitle>イベント情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">開催場所</p>
                  <p className="font-medium">{event.location}</p>
                  <p className="text-sm text-gray-600">{event.prefecture}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">出展者募集状況</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(event.exhibitors?.length / event.maxExhibitors) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {event.exhibitors?.length} / {event.maxExhibitors}
                    </span>
                  </div>
                </div>

                {event.isOnline && event.meetingUrl && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">オンライン参加</p>
                    <Link href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        ミーティングに参加
                      </Button>
                    </Link>
                  </div>
                )}

                {isOwner && (
                  <div className="pt-4 border-t space-y-2">
                    <Link href={`/events/${event.id}/edit`}>
                      <Button className="w-full" variant="outline">
                        イベントを編集
                      </Button>
                    </Link>
                    <Link href={`/events/${event.id}/exhibitors`}>
                      <Button className="w-full" variant="outline">
                        出展者管理
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 主催者情報 */}
            <Card>
              <CardHeader>
                <CardTitle>主催者情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{event.user?.name}</p>
                    <p className="text-sm text-gray-600">イベント主催者</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}