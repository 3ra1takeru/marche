import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      eventId,
      exhibitorId,
      serviceId,
      startTime,
      endTime,
      paymentMethod,
      totalAmount,
      notes,
    } = body

    // サービスの存在確認
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        exhibitor: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // 時間の重複チェック
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        serviceId,
        status: { not: "CANCELLED" },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "この時間は既に予約されています" },
        { status: 400 }
      )
    }

    // 予約作成
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        eventId,
        exhibitorId,
        serviceId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: paymentMethod === "CREDIT_CARD" ? "PENDING" : "CONFIRMED",
        paymentMethod,
        totalAmount,
        notes: notes || null,
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const serviceId = searchParams.get("serviceId")

    const where: any = {
      userId: session.user.id,
    }

    if (eventId) {
      where.eventId = eventId
    }

    if (serviceId) {
      where.serviceId = serviceId
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        event: {
          select: {
            title: true,
            startDate: true,
            location: true,
          },
        },
        exhibitor: {
          select: {
            name: true,
            businessName: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
            duration: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}