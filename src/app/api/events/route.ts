import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prefecture = searchParams.get("prefecture")
    const eventType = searchParams.get("eventType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {
      status: "PUBLISHED",
    }

    if (prefecture) {
      where.prefecture = prefecture
    }

    if (eventType) {
      where.eventType = eventType
    }

    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) {
        where.startDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate)
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        exhibitors: true,
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Events API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.membershipType !== "PREMIUM") {
      return NextResponse.json(
        { error: "Premium membership required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      location,
      prefecture,
      startDate,
      endDate,
      eventType,
      maxExhibitors,
      isOnline,
      isOnDemand,
      meetingUrl,
    } = body

    const event = await prisma.event.create({
      data: {
        userId: session.user.id,
        title,
        description,
        location,
        prefecture,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        eventType,
        maxExhibitors,
        isOnline,
        isOnDemand,
        meetingUrl,
        status: "DRAFT",
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}