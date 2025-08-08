import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { saveEventRegistrationToSheets } from "@/lib/google-sheets"

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const exhibitors = await prisma.exhibitor.findMany({
      where: {
        eventId: params.eventId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        products: true,
        services: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(exhibitors)
  } catch (error) {
    console.error("Get exhibitors error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // イベントの存在確認と募集状況チェック
    const event = await prisma.event.findUnique({
      where: {
        id: params.eventId,
      },
      include: {
        exhibitors: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.exhibitors.length >= event.maxExhibitors) {
      return NextResponse.json(
        { error: "This event is full" },
        { status: 400 }
      )
    }

    // 既に同じユーザーが申込済みかチェック
    const existingExhibitor = await prisma.exhibitor.findFirst({
      where: {
        eventId: params.eventId,
        userId: session.user.id,
      },
    })

    if (existingExhibitor) {
      return NextResponse.json(
        { error: "You have already registered for this event" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      businessName,
      introduction,
      category,
      snsLinks,
      serviceTime,
      intervalTime,
    } = body

    const exhibitor = await prisma.exhibitor.create({
      data: {
        eventId: params.eventId,
        userId: session.user.id,
        name,
        businessName: businessName || null,
        introduction,
        category,
        snsLinks: snsLinks || {},
        serviceTime: serviceTime || null,
        intervalTime: intervalTime || null,
      },
    })

    // Google Sheetsに登録情報を保存（非同期で実行）
    saveEventRegistrationToSheets({
      eventTitle: event.title,
      eventDate: event.startDate.toISOString().split('T')[0],
      userName: session.user.name!,
      userEmail: session.user.email!,
      exhibitorName: name,
      businessName: businessName,
      category,
      introduction,
      snsLinks: snsLinks || {},
      registeredAt: new Date().toISOString(),
    }).catch(error => {
      console.error('Failed to save event registration to Google Sheets:', error)
    })

    return NextResponse.json(exhibitor, { status: 201 })
  } catch (error) {
    console.error("Create exhibitor error:", error)
    return NextResponse.json(
      { error: "Failed to register as exhibitor" },
      { status: 500 }
    )
  }
}