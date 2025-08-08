"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Search, Filter } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { prefectures, eventTypes } from "@/lib/constants"

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    prefecture: "",
    eventType: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async (params = {}) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams(params)
      const response = await fetch(`/api/events?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const params: any = {}
    if (filters.prefecture) params.prefecture = filters.prefecture
    if (filters.eventType) params.eventType = filters.eventType
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    fetchEvents(params)
  }

  const handleReset = () => {
    setFilters({
      prefecture: "",
      eventType: "",
      startDate: "",
      endDate: "",
    })
    fetchEvents()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">イベントを探す</h1>
          <p className="text-white/90">
            全国のマルシェやイベントを検索できます
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 検索フィルター */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              検索条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <Select
                  value={filters.prefecture}
                  onValueChange={(value) => 
                    setFilters({ ...filters, prefecture: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {prefectures.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">イベントタイプ</Label>
                <Select
                  value={filters.eventType}
                  onValueChange={(value) => 
                    setFilters({ ...filters, eventType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">開始日</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => 
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">終了日</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => 
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1 md:flex-none">
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
              <Button onClick={handleReset} variant="outline">
                リセット
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* イベント一覧 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">イベントが見つかりません</h3>
              <p className="text-gray-600">
                検索条件を変更してお試しください
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                {event.coverImage && (
                  <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  <CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.prefecture} - {event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(event.startDate), "yyyy年MM月dd日", { locale: ja })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          出展者: {event.exhibitors?.length || 0} / {event.maxExhibitors}
                        </span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      主催: {event.user?.name}
                    </span>
                    {event.isOnline && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        オンライン
                      </span>
                    )}
                  </div>
                  <Link href={`/events/${event.id}`}>
                    <Button className="w-full">詳細を見る</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}