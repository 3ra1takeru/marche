"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, TrendingUp, Plus, Edit, Trash2, Eye, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalExhibitors: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
        setStats(data.stats || {
          totalEvents: 0,
          totalExhibitors: 0,
          totalBookings: 0,
          monthlyRevenue: 0,
        })
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("このイベントを削除してもよろしいですか？")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchDashboardData()
        }
      } catch (error) {
        console.error("Failed to delete event:", error)
      }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ダッシュボード</h1>
        <p className="text-gray-600">
          ようこそ、{session.user.name}さん
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              イベント数
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              アクティブなイベント
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              出展者数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExhibitors}</div>
            <p className="text-xs text-muted-foreground">
              登録済み出展者
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              予約数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              今月の予約
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              売上
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              今月の売上
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">イベント管理</TabsTrigger>
          <TabsTrigger value="bookings">予約管理</TabsTrigger>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">マイイベント</h2>
            {session.user.membershipType === "PREMIUM" ? (
              <Link href="/events/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新規イベント作成
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signup?plan=premium">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  プレミアムにアップグレード
                </Button>
              </Link>
            )}
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">イベントがありません</h3>
                <p className="text-gray-600 mb-4">
                  {session.user.membershipType === "PREMIUM"
                    ? "新しいイベントを作成してみましょう"
                    : "プレミアムプランにアップグレードしてイベントを作成しましょう"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event: any) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.startDate), "yyyy年MM月dd日", { locale: ja })}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/events/${event.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/events/${event.id}/edit`}>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        出展者: {event.exhibitors?.length || 0} / {event.maxExhibitors}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === "PUBLISHED" 
                          ? "bg-green-100 text-green-800"
                          : event.status === "DRAFT"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {event.status === "PUBLISHED" ? "公開中" : 
                         event.status === "DRAFT" ? "下書き" : "終了"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>予約管理</CardTitle>
              <CardDescription>
                あなたの予約を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">予約機能は現在開発中です</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
              <CardDescription>
                アカウント情報を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">名前</label>
                <p className="text-gray-600">{session.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">メールアドレス</label>
                <p className="text-gray-600">{session.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">会員タイプ</label>
                <p className="text-gray-600">
                  {session.user.membershipType === "PREMIUM" ? "プレミアム会員" : "無料会員"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}