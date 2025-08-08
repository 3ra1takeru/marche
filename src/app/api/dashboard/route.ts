import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーのイベントを取得
    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exhibitors: true,
        bookings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // 統計情報を計算
    const stats = {
      totalEvents: events.length,
      totalExhibitors: events.reduce((acc, event) => acc + event.exhibitors.length, 0),
      totalBookings: events.reduce((acc, event) => acc + event.bookings.length, 0),
      monthlyRevenue: 0, // TODO: Stripe連携後に実装
    }

    return NextResponse.json({
      events,
      stats,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}