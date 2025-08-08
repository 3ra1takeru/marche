"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, User, Building, Link as LinkIcon, ShoppingBag, Clock, Star, Instagram, Twitter, Globe } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export default function ExhibitorDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [exhibitor, setExhibitor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.exhibitorId) {
      fetchExhibitor()
    }
  }, [params.exhibitorId])

  const fetchExhibitor = async () => {
    try {
      const response = await fetch(`/api/exhibitors/${params.exhibitorId}`)
      if (response.ok) {
        const data = await response.json()
        setExhibitor(data)
      }
    } catch (error) {
      console.error("Failed to fetch exhibitor:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSnsIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />
      case 'twitter':
        return <Twitter className="h-4 w-4" />
      case 'website':
        return <Globe className="h-4 w-4" />
      default:
        return <LinkIcon className="h-4 w-4" />
    }
  }

  const getSnsUrl = (platform: string, value: string) => {
    switch (platform) {
      case 'instagram':
        return value.startsWith('@') 
          ? `https://instagram.com/${value.slice(1)}`
          : `https://instagram.com/${value}`
      case 'twitter':
        return value.startsWith('@')
          ? `https://twitter.com/${value.slice(1)}`
          : `https://twitter.com/${value}`
      case 'website':
        return value.startsWith('http') ? value : `https://${value}`
      default:
        return value
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!exhibitor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">出展者が見つかりません</h2>
            <Link href="/events">
              <Button>イベント一覧に戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {exhibitor.category}
              </Badge>
              {exhibitor.serviceTime && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Clock className="mr-1 h-3 w-3" />
                  {exhibitor.serviceTime}分サービス
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {exhibitor.businessName || exhibitor.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {exhibitor.name}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {exhibitor.event && format(new Date(exhibitor.event.startDate), "yyyy年MM月dd日", { locale: ja })}
              </span>
              {exhibitor.event && (
                <Link
                  href={`/events/${exhibitor.event.id}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  {exhibitor.event.title}
                </Link>
              )}
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
                <CardTitle>出展者について</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{exhibitor.introduction}</p>
              </CardContent>
            </Card>

            {/* タブコンテンツ */}
            <Tabs defaultValue="products" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">商品・作品</TabsTrigger>
                <TabsTrigger value="services">サービス・体験</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                {exhibitor.products?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">商品情報はまだ登録されていません</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {exhibitor.products?.map((product: any) => (
                      <Card key={product.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{product.name}</CardTitle>
                              <CardDescription className="mt-2">
                                ¥{product.price.toLocaleString()}
                              </CardDescription>
                            </div>
                            {product.stock && (
                              <Badge variant="outline">
                                在庫: {product.stock}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            {product.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                {exhibitor.services?.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">サービス情報はまだ登録されていません</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {exhibitor.services?.map((service: any) => (
                      <Card key={service.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{service.name}</CardTitle>
                              <CardDescription className="mt-2">
                                ¥{service.price.toLocaleString()} / {service.duration}分
                              </CardDescription>
                            </div>
                            <Button size="sm">
                              予約する
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">出展者名</p>
                  <p className="font-medium">{exhibitor.name}</p>
                </div>
                
                {exhibitor.businessName && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">屋号・ブランド名</p>
                    <p className="font-medium">{exhibitor.businessName}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">出展ジャンル</p>
                  <Badge>{exhibitor.category}</Badge>
                </div>

                {exhibitor.serviceTime && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">サービス時間</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {exhibitor.serviceTime}分
                        {exhibitor.intervalTime && ` (休憩${exhibitor.intervalTime}分)`}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SNSリンク */}
            {exhibitor.snsLinks && Object.keys(exhibitor.snsLinks).some(key => exhibitor.snsLinks[key]) && (
              <Card>
                <CardHeader>
                  <CardTitle>SNS・ウェブサイト</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(exhibitor.snsLinks).map(([platform, value]) => {
                    if (!value) return null
                    return (
                      <Link
                        key={platform}
                        href={getSnsUrl(platform, value as string)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        {getSnsIcon(platform)}
                        <span className="capitalize">{platform}</span>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* イベント情報 */}
            {exhibitor.event && (
              <Card>
                <CardHeader>
                  <CardTitle>参加イベント</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/events/${exhibitor.event.id}`}>
                    <div className="hover:bg-gray-50 p-2 rounded transition-colors">
                      <p className="font-medium mb-1">{exhibitor.event.title}</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(exhibitor.event.startDate), "yyyy年MM月dd日", { locale: ja })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {exhibitor.event.location}
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}